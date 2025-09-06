defmodule Streampai.LivestreamManager.CloudflareManager do
  @moduledoc """
  Manages Cloudflare Live streaming infrastructure for a user.
  Handles live inputs (where user streams to) and live outputs (where stream goes).
  """
  use GenServer
  require Logger

  alias Streampai.LivestreamManager.StreamStateServer

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
    # :inactive, :ready, :live, :error
    :stream_status
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
      stream_status: :inactive
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

  # Server callbacks

  @impl true
  def handle_info(:initialize_live_input, state) do
    case create_live_input(state) do
      {:ok, live_input} ->
        state = %{state | live_input: live_input, stream_status: :ready}

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
  end

  @impl true
  def handle_call(:get_stream_config, _from, state) do
    config = %{
      live_input: state.live_input,
      live_outputs: state.live_outputs,
      stream_status: state.stream_status,
      rtmp_url: get_rtmp_url(state),
      stream_key: get_stream_key(state)
    }

    {:reply, config, state}
  end

  @impl true
  def handle_call({:configure_outputs, platform_configs}, _from, state) do
    case update_live_outputs(state, platform_configs) do
      {:ok, new_outputs} ->
        state = %{state | live_outputs: new_outputs}

        Logger.info(
          "Updated live outputs for user #{state.user_id}: #{inspect(Map.keys(new_outputs))}"
        )

        {:reply, :ok, state}

        # TODO: Handle errors when real Cloudflare API is implemented
        # {:error, reason} ->
        #   Logger.error("Failed to configure outputs for user #{state.user_id}: #{inspect(reason)}")
        #   {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call(:start_streaming, _from, state) do
    if state.stream_status == :ready and not Enum.empty?(state.live_outputs) do
      case enable_live_outputs(state) do
        :ok ->
          state = %{state | stream_status: :live}
          update_stream_state(state)

          Logger.info("Started streaming for user #{state.user_id}")
          {:reply, :ok, state}

          # TODO: Handle errors when real Cloudflare API is implemented
          # {:error, reason} ->
          #   Logger.error("Failed to start streaming for user #{state.user_id}: #{inspect(reason)}")
          #   {:reply, {:error, reason}, state}
      end
    else
      {:reply, {:error, :not_ready}, state}
    end
  end

  @impl true
  def handle_call(:stop_streaming, _from, state) do
    case disable_live_outputs(state) do
      :ok ->
        state = %{state | stream_status: :ready}
        update_stream_state(state)

        Logger.info("Stopped streaming for user #{state.user_id}")
        {:reply, :ok, state}

        # TODO: Handle errors when real Cloudflare API is implemented
        # {:error, reason} ->
        #   Logger.error("Failed to stop streaming for user #{state.user_id}: #{inspect(reason)}")
        #   {:reply, {:error, reason}, state}
    end
  end

  # Helper functions

  defp via_tuple(user_id) do
    {:via, Registry, {Streampai.LivestreamManager.Registry, {:cloudflare_manager, user_id}}}
  end

  defp load_cloudflare_config do
    %{
      account_id: System.get_env("CLOUDFLARE_ACCOUNT_ID") || "default_account",
      api_token: System.get_env("CLOUDFLARE_API_TOKEN") || "default_token"
    }
  end

  defp create_live_input(state) do
    # TODO: Implement actual Cloudflare API calls
    # For now, return mock data
    {:ok,
     %{
       input_id: "live_input_#{state.user_id}_#{:rand.uniform(1000)}",
       rtmp_url: "rtmp://live.cloudflare.com/live",
       rtmp_playback_url:
         "https://customer-#{:rand.uniform(1000)}.cloudflarestream.com/live.m3u8",
       srt_url: "srt://live.cloudflare.com:778",
       webrtc_url: "https://webrtc.live.cloudflare.com",
       stream_key: generate_stream_key(state.user_id)
     }}
  end

  defp update_live_outputs(_state, platform_configs) do
    # TODO: Implement actual Cloudflare Live Output API calls
    # For now, return mock configuration
    outputs =
      Enum.into(platform_configs, %{}, fn {platform, config} ->
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
    "stream_#{user_id}_#{:crypto.strong_rand_bytes(16) |> Base.encode64() |> String.slice(0, 16)}"
  end

  defp get_platform_rtmp_url(:twitch), do: "rtmp://ingest.twitch.tv/live"
  defp get_platform_rtmp_url(:youtube), do: "rtmp://a.rtmp.youtube.com/live2"
  defp get_platform_rtmp_url(:facebook), do: "rtmps://live-api-s.facebook.com:443/rtmp"
  defp get_platform_rtmp_url(:kick), do: "rtmp://ingest.kick.com/live"

  defp update_stream_state(state) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:stream_state, state.user_id}) do
      [{pid, _}] ->
        cloudflare_config = %{
          input_id: state.live_input && state.live_input.input_id,
          rtmp_url: get_rtmp_url(state),
          stream_key: get_stream_key(state),
          status: state.stream_status
        }

        StreamStateServer.set_cloudflare_input(pid, cloudflare_config)

      [] ->
        :ok
    end
  end
end
