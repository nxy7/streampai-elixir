defmodule Streampai.LivestreamManager.CloudflareManager do
  @moduledoc """
  Manages Cloudflare Live streaming infrastructure for a user.
  Handles live inputs (where user streams to) and live outputs (where stream goes).
  """
  use GenServer

  alias Streampai.Cloudflare.APIClient
  alias Streampai.Cloudflare.LiveInput
  alias Streampai.LivestreamManager.StreamStateServer

  require Logger

  defstruct [
    :user_id,
    # Cloudflare account ID
    :account_id,
    # Cloudflare API token
    :api_token,
    # Current live input configuration
    :live_input,
    # Map of platform => output configuration
    :live_outputs,
    # :inactive, :ready, :streaming, :ending, :error
    :stream_status,
    # Input streaming status: :offline, :live
    :input_streaming_status,
    # Last time input was detected as streaming
    :last_streaming_at,
    # Timer reference for polling
    :poll_timer,
    # Timer reference for disconnect timeout
    :disconnect_timer,
    # Polling interval in milliseconds
    :poll_interval
  ]

  def start_link(user_id) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  @impl true
  def init(user_id) do
    config = load_cloudflare_config()

    state = %__MODULE__{
      user_id: user_id,
      account_id: config.account_id,
      api_token: config.api_token,
      live_outputs: %{},
      stream_status: :inactive,
      input_streaming_status: :offline,
      last_streaming_at: nil,
      poll_timer: nil,
      disconnect_timer: nil,
      poll_interval: config.poll_interval
    }

    send(self(), :initialize_live_input)

    Logger.info("CloudflareManager started for user #{user_id}")
    {:ok, state}
  end

  @doc """
  Gets the current Cloudflare stream configuration.
  """
  def get_stream_config(server) do
    GenServer.call(server, :get_stream_config, 15_000)
  end

  @doc """
  Configures live outputs to specified platforms.
  platform_configs: %{twitch: %{enabled: true, stream_key: "..."}, youtube: %{enabled: false}}
  """
  def configure_outputs(server, platform_configs) do
    GenServer.call(server, {:configure_outputs, platform_configs})
  end

  @doc """
  Starts streaming to configured outputs.
  """
  def start_streaming(server) do
    GenServer.call(server, :start_streaming)
  end

  @doc """
  Stops streaming to all outputs.
  """
  def stop_streaming(server) do
    GenServer.call(server, :stop_streaming)
  end

  @doc """
  Gets the current input streaming status (whether user is streaming to input).
  Returns :offline or :live
  """
  def get_input_streaming_status(server) do
    GenServer.call(server, :get_input_streaming_status)
  end

  @doc """
  Gets whether the "Start Stream" button should be shown.
  Returns true if input is streaming but outputs are not active.
  """
  def can_start_streaming?(server) do
    GenServer.call(server, :can_start_streaming)
  end

  @doc """
  Gets detailed status information about the Cloudflare streaming setup.
  Compatible with CloudflareLiveInputMonitor.get_status/1
  """
  def get_status(user_id) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), :get_detailed_status)
  end

  @doc """
  Sets the live input ID to monitor.
  Compatible with CloudflareLiveInputMonitor.set_live_input_id/2
  """
  def set_live_input_id(user_id, input_id) when is_binary(user_id) and is_binary(input_id) do
    GenServer.call(via_tuple(user_id), {:set_live_input_id, input_id})
  end

  # Server callbacks

  @impl true
  def handle_info(:initialize_live_input, state) do
    case create_live_input(state) do
      {:ok, live_input} ->
        # Start polling for input status
        poll_timer = schedule_input_poll(state.poll_interval)

        state = %{state | live_input: live_input, stream_status: :ready, poll_timer: poll_timer}

        # Update stream state with Cloudflare input info
        update_stream_state(state)

        Logger.info("Live input ready for user #{state.user_id}: #{live_input.input_id}")
        {:noreply, state}

      {:error, reason} ->
        Logger.error("Failed to create live input for user #{state.user_id}: #{inspect(reason)}")
        # Retry after 30 seconds
        Process.send_after(self(), :initialize_live_input, 30_000)
        {:noreply, %{state | stream_status: :error}}
    end
  end

  # Periodic input status polling
  @impl true
  def handle_info(:poll_input_status, state) do
    state =
      case check_input_streaming_status(state) do
        {:ok, new_streaming_status} ->
          handle_input_status_change(state, new_streaming_status)

        {:error, _reason} ->
          # Handle API errors gracefully - keep current status
          Logger.debug("[CloudflareManager:#{state.user_id}] Ignoring API error during status check")

          state
      end

    # Schedule next poll
    poll_timer = schedule_input_poll(state.poll_interval)
    state = %{state | poll_timer: poll_timer}

    {:noreply, state}
  end

  # Handle 5-minute disconnect timeout
  @impl true
  def handle_info(:disconnect_timeout, state) do
    Logger.info("Disconnect timeout reached for user #{state.user_id}, stopping stream")

    :ok = disable_live_outputs(state)
    state = %{state | stream_status: :inactive, disconnect_timer: nil}
    update_stream_state(state)

    # Broadcast timeout event
    broadcast_stream_event(state, :stream_auto_stopped, %{reason: :disconnect_timeout})

    {:noreply, state}

    # TODO: Handle error case
  end

  @impl true
  def handle_call(:get_stream_config, _from, state) do
    config = %{
      live_input: state.live_input,
      live_outputs: state.live_outputs,
      stream_status: state.stream_status,
      input_streaming_status: state.input_streaming_status,
      rtmp_url: get_rtmp_url(state),
      stream_key: get_stream_key(state),
      can_start_streaming: can_start_streaming_internal(state)
    }

    {:reply, config, state}
  end

  @impl true
  def handle_call(:get_input_streaming_status, _from, state) do
    {:reply, state.input_streaming_status, state}
  end

  @impl true
  def handle_call(:can_start_streaming, _from, state) do
    {:reply, can_start_streaming_internal(state), state}
  end

  @impl true
  def handle_call({:configure_outputs, platform_configs}, _from, state) do
    {:ok, new_outputs} = update_live_outputs(state, platform_configs)
    state = %{state | live_outputs: new_outputs}

    Logger.info("Updated live outputs for user #{state.user_id}: #{inspect(Map.keys(new_outputs))}")

    {:reply, :ok, state}

    # TODO: Handle errors when real Cloudflare API is implemented
    # {:error, reason} ->
    #   Logger.error("Failed to configure outputs for user #{state.user_id}: #{inspect(reason)}")
    #   {:reply, {:error, reason}, state}
  end

  @impl true
  def handle_call(:start_streaming, _from, state) do
    if can_start_streaming_internal(state) do
      :ok = enable_live_outputs(state)
      # Cancel disconnect timer if it exists
      disconnect_timer = cancel_timer(state.disconnect_timer)

      state = %{state | stream_status: :streaming, disconnect_timer: disconnect_timer}
      update_stream_state(state)

      Logger.info("Started streaming for user #{state.user_id}")
      {:reply, :ok, state}

      # TODO: Handle errors when real Cloudflare API is implemented
      # {:error, reason} ->
      #   Logger.error("Failed to start streaming for user #{state.user_id}: #{inspect(reason)}")
      #   {:reply, {:error, reason}, state}
    else
      reason =
        if state.input_streaming_status == :live,
          do: :no_outputs_configured,
          else: :input_not_streaming

      {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call(:stop_streaming, _from, state) do
    :ok = disable_live_outputs(state)
    # Cancel disconnect timer
    disconnect_timer = cancel_timer(state.disconnect_timer)

    # Return to ready state if input is still streaming, otherwise inactive
    new_status = if state.input_streaming_status == :live, do: :ready, else: :inactive

    state = %{state | stream_status: new_status, disconnect_timer: disconnect_timer}
    update_stream_state(state)

    Logger.info("Stopped streaming for user #{state.user_id}")
    {:reply, :ok, state}

    # TODO: Handle errors when real Cloudflare API is implemented
    # {:error, reason} ->
    #   Logger.error("Failed to stop streaming for user #{state.user_id}: #{inspect(reason)}")
    #   {:reply, {:error, reason}, state}
  end

  @impl true
  def handle_call(:get_detailed_status, _from, state) do
    status = %{
      user_id: state.user_id,
      is_streaming: state.input_streaming_status == :live,
      live_input_id: get_input_id(state.live_input),
      last_status: state.live_input,
      # Could track this if needed
      poll_count: 0
    }

    {:reply, status, state}
  end

  @impl true
  def handle_call({:set_live_input_id, input_id}, _from, %{live_input: nil} = state) do
    new_state = %{state | live_input: %{input_id: input_id}}
    Logger.info("[CloudflareManager:#{state.user_id}] Live input ID set to: #{input_id}")
    {:reply, :ok, new_state}
  end

  def handle_call({:set_live_input_id, input_id}, _from, %{live_input: live_input} = state) do
    updated_input = Map.put(live_input, :input_id, input_id)
    new_state = %{state | live_input: updated_input}
    Logger.info("[CloudflareManager:#{state.user_id}] Live input ID set to: #{input_id}")
    {:reply, :ok, new_state}
  end

  # Helper functions

  defp via_tuple(user_id) do
    {:via, Registry, {Streampai.LivestreamManager.Registry, {:cloudflare_manager, user_id}}}
  end

  defp load_cloudflare_config do
    %{
      account_id: System.get_env("CLOUDFLARE_ACCOUNT_ID") || "default_account",
      api_token: System.get_env("CLOUDFLARE_API_TOKEN") || "default_token",
      poll_interval: Application.get_env(:streampai, :cloudflare_input_poll_interval, 15_000)
    }
  end

  defp create_live_input(state) do
    Logger.info("[CloudflareManager:#{state.user_id}] Starting live input creation...")

    case LiveInput.get_or_fetch_for_user_with_test_mode(state.user_id,
           actor: %{id: state.user_id}
         ) do
      {:ok, live_input} ->
        case live_input.data do
          %{
            "uid" => input_id,
            "rtmps" => %{"url" => rtmp_url, "streamKey" => stream_key},
            "srt" => %{"url" => srt_url},
            "webRTC" => %{"url" => webrtc_url}
          } ->
            {:ok,
             %{
               input_id: input_id,
               rtmp_url: rtmp_url,
               rtmp_playback_url: rtmp_url,
               srt_url: srt_url,
               webrtc_url: webrtc_url,
               stream_key: stream_key
             }}

          invalid_data ->
            Logger.error("[CloudflareManager:#{state.user_id}] Invalid live input data: #{inspect(invalid_data)}")

            {:error, "Invalid live input data structure"}
        end

      {:error, reason} ->
        Logger.error("[CloudflareManager:#{state.user_id}] Failed to get/fetch live input: #{inspect(reason)}")

        {:error, reason}
    end
  rescue
    error ->
      Logger.error("[CloudflareManager:#{state.user_id}] Exception during live input creation: #{inspect(error)}")

      {:error, error}
  end

  defp update_live_outputs(state, platform_configs) do
    input_id = get_input_id(state.live_input)

    case input_id do
      nil -> {:error, :no_input_id}
      id -> create_platform_outputs(state, id, platform_configs)
    end
  end

  defp create_platform_outputs(state, input_id, platform_configs) do
    outputs =
      Map.new(platform_configs, fn {platform, config} ->
        create_single_output(state, input_id, platform, config)
      end)

    {:ok, outputs}
  end

  defp create_single_output(state, input_id, platform, %{enabled: true} = config) do
    output_config = %{
      url: get_platform_rtmp_url(platform),
      stream_key: config.stream_key,
      enabled: true
    }

    case APIClient.create_live_output(input_id, output_config) do
      {:ok, %{"uid" => output_id}} ->
        {platform,
         %{
           output_id: output_id,
           platform: platform,
           stream_key: config.stream_key,
           rtmp_url: output_config.url,
           enabled: true
         }}

      {:error, _error_type, message} ->
        Logger.error("[CloudflareManager:#{state.user_id}] Failed to create output for #{platform}: #{message}")

        {platform, %{enabled: false, error: message}}
    end
  end

  defp create_single_output(_state, _input_id, platform, _config) do
    {platform, %{enabled: false}}
  end

  defp enable_live_outputs(state) do
    case {get_input_id(state.live_input), state.live_outputs} do
      {nil, _} -> :ok
      {_, nil} -> :ok
      {input_id, outputs} -> toggle_all_outputs(state, input_id, outputs, true)
    end
  end

  defp disable_live_outputs(state) do
    case {get_input_id(state.live_input), state.live_outputs} do
      {nil, _} -> :ok
      {_, nil} -> :ok
      {input_id, outputs} -> toggle_all_outputs(state, input_id, outputs, false)
    end
  end

  defp toggle_all_outputs(state, input_id, outputs, enabled) do
    Enum.each(outputs, fn {_platform, output_config} ->
      if output_config[:output_id] do
        toggle_single_output(state, input_id, output_config.output_id, enabled)
      end
    end)

    :ok
  end

  defp toggle_single_output(state, input_id, output_id, enabled) do
    action = if enabled, do: "enable", else: "disable"
    past_action = if enabled, do: "Enabled", else: "Disabled"

    case APIClient.toggle_live_output(input_id, output_id, enabled) do
      {:ok, _} ->
        Logger.info("[CloudflareManager:#{state.user_id}] #{past_action} output #{output_id}")

      {:error, _error_type, message} ->
        Logger.error("[CloudflareManager:#{state.user_id}] Failed to #{action} output #{output_id}: #{message}")
    end
  end

  defp get_rtmp_url(state) do
    state.live_input && state.live_input.rtmp_url
  end

  defp get_stream_key(state) do
    state.live_input && state.live_input.stream_key
  end

  defp get_platform_rtmp_url(:twitch), do: "rtmp://ingest.twitch.tv/live"
  defp get_platform_rtmp_url(:youtube), do: "rtmp://a.rtmp.youtube.com/live2"
  defp get_platform_rtmp_url(:facebook), do: "rtmps://live-api-s.facebook.com:443/rtmp"
  defp get_platform_rtmp_url(:kick), do: "rtmp://ingest.kick.com/live"

  # Input monitoring helpers

  defp schedule_input_poll(interval) do
    Process.send_after(self(), :poll_input_status, interval)
  end

  defp check_input_streaming_status(state) do
    case state.live_input do
      nil ->
        {:ok, :offline}

      %{input_id: nil} ->
        {:ok, :offline}

      %{input_id: input_id} when is_binary(input_id) ->
        # Use same API client as CloudflareLiveInputMonitor
        case APIClient.get_live_input(input_id) do
          {:ok, input_data} ->
            streaming_status = extract_streaming_status(input_data)
            {:ok, if(streaming_status, do: :live, else: :offline)}

          {:error, :http_error, "HTTP 404 error during get_live_input"} ->
            Logger.warning("[CloudflareManager:#{state.user_id}] Live input #{input_id} not found")

            {:ok, :offline}

          {:error, _error_type, message} ->
            Logger.warning("[CloudflareManager:#{state.user_id}] Failed to check input status: #{inspect(message)}")

            {:error, message}
        end

      _ ->
        {:ok, :offline}
    end
  end

  defp handle_input_status_change(state, new_status) do
    case {state.input_streaming_status, new_status} do
      {:offline, :live} ->
        Logger.info("Input streaming started for user #{state.user_id}")

        state = %{
          state
          | input_streaming_status: :live,
            last_streaming_at: DateTime.utc_now(),
            stream_status: :ready
        }

        update_stream_state(state)
        broadcast_stream_event(state, :input_streaming_started, %{})

        state

      {:live, :offline} ->
        Logger.info("Input streaming stopped for user #{state.user_id}")

        state = %{state | input_streaming_status: :offline, last_streaming_at: DateTime.utc_now()}

        state =
          case state.stream_status do
            :streaming ->
              # Start 5-minute disconnect timer
              disconnect_timer = schedule_disconnect_timeout()
              updated_state = %{state | disconnect_timer: disconnect_timer}
              Logger.info("Started disconnect timeout for user #{state.user_id}")
              updated_state

            _ ->
              # Not streaming outputs, go to inactive
              %{state | stream_status: :inactive}
          end

        update_stream_state(state)
        broadcast_stream_event(state, :input_streaming_stopped, %{})

        state

      _ ->
        # No status change
        state
    end
  end

  defp schedule_disconnect_timeout do
    # 5 minutes
    timeout = Application.get_env(:streampai, :stream_disconnect_timeout, 300_000)
    Process.send_after(self(), :disconnect_timeout, timeout)
  end

  defp cancel_timer(nil), do: nil

  defp cancel_timer(timer_ref) do
    Process.cancel_timer(timer_ref)
    nil
  end

  defp can_start_streaming_internal(state) do
    state.input_streaming_status == :live
  end

  defp broadcast_stream_event(state, event, data) do
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "cloudflare_input:#{state.user_id}",
      {event, Map.merge(data, %{user_id: state.user_id, timestamp: DateTime.utc_now()})}
    )
  end

  defp update_stream_state(state) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:stream_state, state.user_id}) do
      [{pid, _}] ->
        cloudflare_config = %{
          input_id: get_input_id(state.live_input),
          rtmp_url: get_rtmp_url(state),
          stream_key: get_stream_key(state),
          status: state.stream_status,
          input_streaming_status: state.input_streaming_status,
          can_start_streaming: can_start_streaming_internal(state),
          last_streaming_at: state.last_streaming_at
        }

        StreamStateServer.set_cloudflare_input(pid, cloudflare_config)

      [] ->
        :ok
    end
  end

  defp get_input_id(nil), do: nil
  defp get_input_id(%{input_id: input_id}), do: input_id
  defp get_input_id(_), do: nil

  defp extract_streaming_status(%{"status" => %{"current" => %{"state" => state}}}) do
    # Cloudflare statuses: "connected", "live", "live_input_disconnected", etc.
    state in ["connected", "live"]
  end

  defp extract_streaming_status(input_data) do
    Logger.debug("[CloudflareManager] No status.current in input data: #{inspect(input_data)}")
    false
  end
end
