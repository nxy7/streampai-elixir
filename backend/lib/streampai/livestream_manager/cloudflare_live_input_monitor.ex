defmodule Streampai.LivestreamManager.CloudflareLiveInputMonitor do
  @moduledoc """
  Monitors Cloudflare live input status to detect when user starts/stops streaming.

  Polls Cloudflare API to check if stream is active and broadcasts status changes
  via Phoenix.PubSub for real-time updates.
  """
  use GenServer
  require Logger

  alias Streampai.Cloudflare.APIClient
  alias Phoenix.PubSub

  # Poll interval in milliseconds (30 seconds)
  @poll_interval 30_000

  # Stream is considered inactive after this many consecutive failures
  @max_consecutive_failures 3

  def start_link(user_id) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  @impl true
  def init(user_id) do
    schedule_poll()

    state = %{
      user_id: user_id,
      live_input_id: nil,
      is_streaming: false,
      last_status: nil,
      consecutive_failures: 0,
      poll_count: 0
    }

    Logger.info("[CloudflareLiveInputMonitor:#{user_id}] Started monitoring")
    {:ok, state}
  end

  @impl true
  def handle_info(:poll_status, state) do
    schedule_poll()
    new_state = poll_stream_status(state)
    {:noreply, new_state}
  end

  @impl true
  def handle_info(msg, state) do
    Logger.debug("[CloudflareLiveInputMonitor:#{state.user_id}] Unknown message: #{inspect(msg)}")
    {:noreply, state}
  end

  @impl true
  def handle_call(:get_status, _from, state) do
    status = %{
      user_id: state.user_id,
      is_streaming: state.is_streaming,
      live_input_id: state.live_input_id,
      last_status: state.last_status,
      poll_count: state.poll_count
    }

    {:reply, status, state}
  end

  @impl true
  def handle_call({:set_live_input_id, input_id}, _from, state) do
    new_state = %{state | live_input_id: input_id}
    Logger.info("[CloudflareLiveInputMonitor:#{state.user_id}] Live input ID set to: #{input_id}")
    {:reply, :ok, new_state}
  end

  # Public API

  @doc """
  Get current streaming status for a user.
  """
  def get_status(user_id) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), :get_status)
  end

  @doc """
  Set the Cloudflare live input ID to monitor.
  This should be called when the live input is created.
  """
  def set_live_input_id(user_id, input_id) when is_binary(user_id) and is_binary(input_id) do
    GenServer.call(via_tuple(user_id), {:set_live_input_id, input_id})
  end

  # Private functions

  defp poll_stream_status(%{live_input_id: nil} = state) do
    # No live input ID set yet, try to find one for this user
    case find_live_input_for_user(state.user_id) do
      {:ok, input_id} ->
        Logger.info("[CloudflareLiveInputMonitor:#{state.user_id}] Found live input: #{input_id}")
        new_state = %{state | live_input_id: input_id}
        poll_stream_status(new_state)

      {:error, _error_type, message} ->
        Logger.warning(
          "[CloudflareLiveInputMonitor:#{state.user_id}] Error finding live input: #{inspect(message)}"
        )

        handle_poll_failure(state)
    end
  end

  defp poll_stream_status(%{live_input_id: input_id} = state) when is_binary(input_id) do
    case APIClient.get_live_input(input_id) do
      {:ok, input_data} ->
        new_streaming_status = extract_streaming_status(input_data)
        handle_status_change(state, new_streaming_status, input_data)

      {:error, :http_error, message} ->
        case message do
          "HTTP 404 error during get_live_input" ->
            Logger.warning(
              "[CloudflareLiveInputMonitor:#{state.user_id}] Live input #{input_id} not found, clearing ID"
            )

            %{
              state
              | live_input_id: nil,
                is_streaming: false,
                consecutive_failures: 0,
                poll_count: state.poll_count + 1
            }

          _ ->
            Logger.warning(
              "[CloudflareLiveInputMonitor:#{state.user_id}] Failed to get live input status: #{inspect(message)}"
            )

            handle_poll_failure(state)
        end

      {:error, _error_type, message} ->
        Logger.warning(
          "[CloudflareLiveInputMonitor:#{state.user_id}] Failed to get live input status: #{inspect(message)}"
        )

        handle_poll_failure(state)
    end
  end

  defp handle_status_change(state, new_streaming_status, input_data) do
    old_streaming_status = state.is_streaming
    poll_count = state.poll_count + 1

    if new_streaming_status != old_streaming_status do
      Logger.info(
        "[CloudflareLiveInputMonitor:#{state.user_id}] Stream status changed: #{old_streaming_status} -> #{new_streaming_status}"
      )

      broadcast_status_change(state.user_id, new_streaming_status, input_data)
    end

    %{
      state
      | is_streaming: new_streaming_status,
        last_status: input_data,
        consecutive_failures: 0,
        poll_count: poll_count
    }
  end

  defp handle_poll_failure(state) do
    consecutive_failures = state.consecutive_failures + 1
    poll_count = state.poll_count + 1

    if consecutive_failures >= @max_consecutive_failures and state.is_streaming do
      Logger.warning(
        "[CloudflareLiveInputMonitor:#{state.user_id}] Too many failures, marking as not streaming"
      )

      broadcast_status_change(state.user_id, false, %{"reason" => "consecutive_failures"})

      %{
        state
        | is_streaming: false,
          consecutive_failures: consecutive_failures,
          poll_count: poll_count
      }
    else
      %{state | consecutive_failures: consecutive_failures, poll_count: poll_count}
    end
  end

  defp extract_streaming_status(%{"status" => %{"current" => current_status}}) do
    # Cloudflare statuses: "connected", "live", "live_input_disconnected", etc.
    current_status in ["connected", "live"]
  end

  defp extract_streaming_status(input_data) do
    Logger.debug(
      "[CloudflareLiveInputMonitor] No status.current in input data: #{inspect(input_data)}"
    )

    false
  end

  defp find_live_input_for_user(user_id) do
    case Streampai.Cloudflare.LiveInput.get_or_fetch_for_user(user_id) do
      {:ok, [live_input]} ->
        # Extract the Cloudflare input ID from the stored data
        case live_input.data do
          %{"uid" => cloudflare_id} -> {:ok, cloudflare_id}
          _ -> {:error, :no_cloudflare_id, "Live input exists but has no Cloudflare ID"}
        end

      {:ok, []} ->
        {:error, :not_found, "No live input found for user"}

      error ->
        error
    end
  end

  defp broadcast_status_change(user_id, is_streaming, input_data) do
    status = if is_streaming, do: "started", else: "stopped"

    event = %{
      user_id: user_id,
      status: status,
      is_streaming: is_streaming,
      timestamp: DateTime.utc_now(),
      input_data: input_data
    }

    # Broadcast to user-specific topic
    PubSub.broadcast(
      Streampai.PubSub,
      "stream_status:#{user_id}",
      {:stream_status_changed, event}
    )

    # Broadcast to global stream events topic
    PubSub.broadcast(Streampai.PubSub, "stream_events", {:stream_status_changed, event})
  end

  defp schedule_poll do
    Process.send_after(self(), :poll_status, @poll_interval)
  end

  defp via_tuple(user_id) do
    {:via, Registry,
     {Streampai.LivestreamManager.Registry, {:cloudflare_live_input_monitor, user_id}}}
  end
end
