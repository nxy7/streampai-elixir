defmodule Streampai.LivestreamManager.BroadcastStrategy.Cloudflare do
  @moduledoc """
  Cloudflare Stream implementation of the BroadcastStrategy behaviour.

  Wraps existing InputManager/OutputManager/APIClient modules.
  Owns its own poll loop for encoder detection and pushes
  `{:strategy_event, event}` messages to the StreamManager.
  """

  @behaviour Streampai.LivestreamManager.BroadcastStrategy

  alias Streampai.Cloudflare.APIClient
  alias Streampai.LivestreamManager.StreamManager.Cloudflare.InputManager
  alias Streampai.LivestreamManager.StreamManager.Cloudflare.OutputManager

  require Logger

  @poll_interval_key :cloudflare_input_poll_interval
  @default_poll_interval 5_000

  # -- Lifecycle --

  @impl true
  def init(user_id, stream_manager_pid) do
    config = load_config()

    # Build a data map compatible with InputManager's expected shape
    input_manager_data = %{
      user_id: user_id,
      account_id: config.account_id,
      api_token: config.api_token
    }

    case InputManager.get_live_inputs(input_manager_data) do
      {:ok, %{horizontal: horizontal, vertical: vertical}} ->
        state = %{
          user_id: user_id,
          account_id: config.account_id,
          api_token: config.api_token,
          horizontal_input: horizontal,
          vertical_input: vertical,
          live_outputs: %{},
          poll_interval: config.poll_interval,
          stream_manager_pid: stream_manager_pid,
          last_status: :unknown
        }

        # Do one-shot status check and notify immediately
        state = do_poll_and_notify(state)

        # Start the poll loop
        schedule_poll(state.poll_interval)

        {:ok,
         %{
           state: state,
           horizontal_input: horizontal,
           vertical_input: vertical
         }}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @impl true
  def handle_event(state, "stream.live_input.connected") do
    {:status_change, :live, %{state | last_status: :live}}
  end

  def handle_event(state, "stream.live_input.disconnected") do
    {:status_change, :offline, %{state | last_status: :offline}}
  end

  def handle_event(_state, _event), do: :ignore

  # -- Output Management --

  @impl true
  def add_output(state, %{rtmp_url: rtmp_url, stream_key: stream_key, platform: platform}) do
    input_id = get_primary_input_id(state)

    if is_nil(input_id) do
      {:error, :no_input_id}
    else
      output_config = %{rtmp_url: rtmp_url, stream_key: stream_key, enabled: true}

      case APIClient.create_live_output(input_id, output_config) do
        {:ok, %{"uid" => output_id}} ->
          Logger.info("[BroadcastStrategy.Cloudflare] Created output for #{platform}: #{output_id}")

          {:ok, output_id, state}

        {:error, error_type, message} ->
          Logger.error("[BroadcastStrategy.Cloudflare] Failed to create output for #{platform}: #{message}")

          {:error, {error_type, message}}
      end
    end
  end

  @impl true
  def remove_output(state, output_handle) do
    input_id = get_primary_input_id(state)

    if is_nil(input_id) do
      :ok
    else
      case APIClient.delete_live_output(input_id, output_handle) do
        :ok ->
          Logger.info("[BroadcastStrategy.Cloudflare] Deleted output: #{output_handle}")
          :ok

        {:error, _error_type, message} ->
          Logger.warning("[BroadcastStrategy.Cloudflare] Failed to delete output: #{message}")
          {:error, message}
      end
    end
  end

  @impl true
  def cleanup_all_outputs(state) do
    OutputManager.cleanup_all(%{horizontal_input: state.horizontal_input})
  end

  # -- Configuration --

  @impl true
  def build_stream_config(state, state_name) do
    # Build data map compatible with InputManager's expected shape
    data = %{
      horizontal_input: state.horizontal_input,
      vertical_input: state.vertical_input,
      live_outputs: state.live_outputs
    }

    config = InputManager.build_stream_config(data, state_name)

    # Add HLS preview URL from Cloudflare's videodelivery.net
    uid = state.horizontal_input && state.horizontal_input.input_id

    preview_hls_url =
      if uid, do: "https://videodelivery.net/#{uid}/manifest/video.m3u8"

    Map.put(config, :preview_hls_url, preview_hls_url)
  end

  @impl true
  def get_ingest_credentials(state, orientation) do
    input = if orientation == :vertical, do: state.vertical_input, else: state.horizontal_input

    if is_nil(input) do
      {:error, :no_input}
    else
      {:ok,
       %{
         rtmp_url: input.rtmp_url,
         stream_key: input.stream_key,
         srt_url: input.srt_url,
         webrtc_url: input.webrtc_url
       }}
    end
  end

  @impl true
  def regenerate_ingest_credentials(state, orientation) do
    alias Streampai.Cloudflare.LiveInput

    actor = Streampai.SystemActor.system()

    case Ash.get(LiveInput, %{user_id: state.user_id, orientation: orientation}, actor: actor) do
      {:ok, live_input} ->
        case Ash.update(live_input, %{}, action: :regenerate, actor: actor) do
          {:ok, _updated} ->
            # Re-fetch the input through InputManager to get normalized shape
            data = %{
              user_id: state.user_id,
              account_id: state.account_id,
              api_token: state.api_token
            }

            case InputManager.fetch_input_for_orientation(data, orientation) do
              {:ok, new_input} ->
                new_state =
                  if orientation == :vertical,
                    do: %{state | vertical_input: new_input},
                    else: %{state | horizontal_input: new_input}

                {:ok,
                 %{
                   rtmp_url: new_input.rtmp_url,
                   stream_key: new_input.stream_key,
                   srt_url: new_input.srt_url,
                   webrtc_url: new_input.webrtc_url
                 }, new_state}

              {:error, reason} ->
                {:error, reason}
            end

          {:error, reason} ->
            {:error, reason}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  @impl true
  def handle_input_deletion(state) do
    for orientation <- [:horizontal, :vertical] do
      delete_stale_live_input_record(state.user_id, orientation)
    end

    new_state = %{state | horizontal_input: nil, vertical_input: nil, live_outputs: %{}}
    {:reinitialize, new_state}
  end

  # -- Teardown --

  @impl true
  def terminate(state) do
    cleanup_all_outputs(state)
  end

  # -- Internal Poll Loop --

  @doc false
  def handle_poll_message(state) do
    state = do_poll_and_notify(state)
    schedule_poll(state.poll_interval)
    state
  end

  defp do_poll_and_notify(state) do
    # Build data map compatible with InputManager's expected shape
    data = %{
      horizontal_input: state.horizontal_input,
      vertical_input: state.vertical_input
    }

    case InputManager.check_streaming_status(data) do
      {:ok, new_status} ->
        if new_status != state.last_status and state.last_status != :unknown do
          event =
            case new_status do
              :live -> :encoder_connected
              :offline -> :encoder_disconnected
            end

          send(state.stream_manager_pid, {:strategy_event, event})
        end

        # On first check (:unknown), still notify so StreamManager can pick
        # the correct initial state
        if state.last_status == :unknown do
          event =
            case new_status do
              :live -> :encoder_connected
              :offline -> :encoder_disconnected
            end

          send(state.stream_manager_pid, {:strategy_event, event})
        end

        %{state | last_status: new_status}

      {:error, :input_deleted} ->
        Logger.warning("[BroadcastStrategy.Cloudflare] Live input deleted, notifying StreamManager")

        send(state.stream_manager_pid, {:strategy_event, :input_deleted})
        %{state | last_status: :unknown}

      {:error, _reason} ->
        state
    end
  end

  defp schedule_poll(interval) do
    Process.send_after(self(), :broadcast_strategy_poll, interval)
  end

  # -- Helpers --

  defp get_primary_input_id(%{horizontal_input: %{input_id: id}}) when is_binary(id), do: id
  defp get_primary_input_id(_), do: nil

  defp load_config do
    %{
      account_id: System.get_env("CLOUDFLARE_ACCOUNT_ID") || "default_account",
      api_token: System.get_env("CLOUDFLARE_API_TOKEN") || "default_token",
      poll_interval: Application.get_env(:streampai, @poll_interval_key, @default_poll_interval)
    }
  end

  defp delete_stale_live_input_record(user_id, orientation) do
    import Ash.Query

    alias Streampai.Cloudflare.LiveInput

    query = filter(LiveInput, user_id == ^user_id and orientation == ^orientation)

    case Ash.read_one(query, actor: %{id: user_id}) do
      {:ok, live_input} when not is_nil(live_input) ->
        case Ash.destroy(live_input, actor: %{id: user_id}) do
          :ok -> Logger.info("Deleted stale #{orientation} live input record")
          {:error, reason} -> Logger.warning("Failed to delete stale record: #{inspect(reason)}")
        end

      _ ->
        :ok
    end
  end
end
