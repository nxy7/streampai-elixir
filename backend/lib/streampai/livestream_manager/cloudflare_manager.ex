defmodule Streampai.LivestreamManager.CloudflareManager do
  @moduledoc """
  Manages Cloudflare Live streaming infrastructure for a user.
  Handles live inputs (where user streams to) and live outputs (where stream goes).
  """
  use GenServer

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
    # Load Cloudflare configuration from environment/database
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

    # Initialize live input for this user
    send(self(), :initialize_live_input)

    Logger.info("CloudflareManager started for user #{user_id}")
    {:ok, state}
  end

  # Client API

  @doc """
  Gets the current Cloudflare stream configuration.
  """
  def get_stream_config(server) do
    GenServer.call(server, :get_stream_config)
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

  # Server callbacks

  @impl true
  def handle_info(:initialize_live_input, state) do
    {:ok, live_input} = create_live_input(state)
    # Start polling for input status
    poll_timer = schedule_input_poll(state.poll_interval)

    state = %{state | live_input: live_input, stream_status: :ready, poll_timer: poll_timer}

    # Update stream state with Cloudflare input info
    update_stream_state(state)

    Logger.info("Live input created for user #{state.user_id}: #{live_input.input_id}")
    {:noreply, state}

    # TODO: Handle errors when real Cloudflare API is implemented
    # {:error, reason} ->
    #   Logger.error("Failed to create live input for user #{state.user_id}: #{inspect(reason)}")
    #   Process.send_after(self(), :initialize_live_input, 30_000)
    #   {:noreply, %{state | stream_status: :error}}
  end

  # Periodic input status polling
  @impl true
  def handle_info(:poll_input_status, state) do
    {:ok, new_streaming_status} = check_input_streaming_status(state)
    state = handle_input_status_change(state, new_streaming_status)

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
    # TODO: Implement actual Cloudflare API calls
    # For now, return mock data
    {:ok,
     %{
       input_id: "live_input_#{state.user_id}_#{:rand.uniform(1000)}",
       rtmp_url: "rtmp://live.cloudflare.com/live",
       rtmp_playback_url: "https://customer-#{:rand.uniform(1000)}.cloudflarestream.com/live.m3u8",
       srt_url: "srt://live.cloudflare.com:778",
       webrtc_url: "https://webrtc.live.cloudflare.com",
       stream_key: generate_stream_key(state.user_id)
     }}
  end

  defp update_live_outputs(_state, platform_configs) do
    # TODO: Implement actual Cloudflare Live Output API calls
    # For now, return mock configuration
    outputs =
      Map.new(platform_configs, fn {platform, config} ->
        if config.enabled do
          output_config = %{
            output_id: "output_#{platform}_#{:rand.uniform(1000)}",
            platform: platform,
            stream_key: config.stream_key,
            rtmp_url: get_platform_rtmp_url(platform),
            enabled: true
          }

          {platform, output_config}
        else
          {platform, %{enabled: false}}
        end
      end)

    {:ok, outputs}
  end

  defp enable_live_outputs(_state) do
    # TODO: Enable all configured live outputs via Cloudflare API
    :ok
  end

  defp disable_live_outputs(_state) do
    # TODO: Disable all live outputs via Cloudflare API
    :ok
  end

  defp get_rtmp_url(state) do
    state.live_input && state.live_input.rtmp_url
  end

  defp get_stream_key(state) do
    state.live_input && state.live_input.stream_key
  end

  defp generate_stream_key(user_id) do
    "stream_#{user_id}_#{16 |> :crypto.strong_rand_bytes() |> Base.encode64() |> String.slice(0, 16)}"
  end

  defp get_platform_rtmp_url(:twitch), do: "rtmp://ingest.twitch.tv/live"
  defp get_platform_rtmp_url(:youtube), do: "rtmp://a.rtmp.youtube.com/live2"
  defp get_platform_rtmp_url(:facebook), do: "rtmps://live-api-s.facebook.com:443/rtmp"
  defp get_platform_rtmp_url(:kick), do: "rtmp://ingest.kick.com/live"

  # Input monitoring helpers

  defp schedule_input_poll(interval) do
    Process.send_after(self(), :poll_input_status, interval)
  end

  defp check_input_streaming_status(_state) do
    # TODO: Implement actual Cloudflare API call to check input status
    # For now, return stable mock status (always offline) to prevent false positives
    # When real API is implemented, this will check actual input streaming status
    {:ok, :offline}
  end

  defp handle_input_status_change(state, new_status) do
    case {state.input_streaming_status, new_status} do
      {:offline, :live} ->
        # Input started streaming
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
        # Input stopped streaming
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
    state.input_streaming_status == :live and
      not Enum.empty?(state.live_outputs) and
      state.stream_status != :streaming
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
          input_id: state.live_input && state.live_input.input_id,
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
end
