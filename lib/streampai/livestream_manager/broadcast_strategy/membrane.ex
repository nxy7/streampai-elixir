defmodule Streampai.LivestreamManager.BroadcastStrategy.Membrane do
  @moduledoc """
  Membrane (self-hosted) implementation of the BroadcastStrategy behaviour.

  Accepts RTMP ingest via a shared `Membrane.RTMPServer`, starts a per-user
  pipeline on encoder connect, and relays to platform RTMP endpoints via
  dynamically added `Membrane.RTMP.Sink` elements.

  Encoder detection is event-driven (no polling): the RTMPServer notifies
  the StreamManager when a client connects, and the pipeline notifies on
  disconnect. Bitrate is calculated from buffer sizes and reported to the
  StreamManager for DB storage.
  """

  @behaviour Streampai.LivestreamManager.BroadcastStrategy

  alias Streampai.LivestreamManager.BroadcastStrategy.Membrane.Pipeline
  alias Streampai.LivestreamManager.BroadcastStrategy.Membrane.RTMPServer
  alias Streampai.LivestreamManager.Transcription
  alias Streampai.Stream.MembraneLiveInput

  require Logger

  # -- Lifecycle --

  @impl true
  def init(user_id, stream_manager_pid) do
    host = Application.get_env(:streampai, :membrane_rtmp_host, "localhost")
    port = Application.get_env(:streampai, :membrane_rtmp_port, 1935)
    rtmp_url = "rtmp://#{host}:#{port}/live"

    # Get or create a persisted stream key (survives restarts and strategy swaps)
    with {:ok, h_record} <- MembraneLiveInput.get_or_create(user_id, :horizontal),
         {:ok, v_record} <- MembraneLiveInput.get_or_create(user_id, :vertical) do
      stream_key = h_record.stream_key

      # Register with the RTMPServer so it can route incoming connections
      :ok = RTMPServer.register_stream_key(stream_key, user_id, stream_manager_pid)

      input_info = %{
        input_id: stream_key,
        orientation: :horizontal,
        rtmp_url: rtmp_url,
        stream_key: stream_key,
        srt_url: nil,
        webrtc_url: nil
      }

      v_input_info = %{
        input_id: v_record.stream_key,
        orientation: :vertical,
        rtmp_url: rtmp_url,
        stream_key: v_record.stream_key,
        srt_url: nil,
        webrtc_url: nil
      }

      hls_output_dir = Path.join(System.tmp_dir!(), "streampai_hls/#{user_id}")

      state = %{
        user_id: user_id,
        stream_manager_pid: stream_manager_pid,
        stream_key: stream_key,
        rtmp_url: "#{rtmp_url}/#{stream_key}",
        pipeline_pid: nil,
        transcription_client_pid: nil,
        horizontal_input: input_info,
        vertical_input: v_input_info,
        outputs: %{},
        last_status: :offline,
        hls_output_dir: hls_output_dir
      }

      Logger.info(
        "[BroadcastStrategy.Membrane] initialized for user #{user_id}, key=#{String.slice(stream_key, 0..15)}..."
      )

      {:ok,
       %{
         state: state,
         horizontal_input: input_info,
         vertical_input: v_input_info
       }}
    end
  end

  @impl true
  def handle_event(state, :encoder_disconnected) do
    Logger.info("[BroadcastStrategy.Membrane] encoder disconnected")

    # Stop transcription client
    stop_transcription(state)

    # Clean up stale HLS segments so they don't serve after the stream ends
    if state.hls_output_dir do
      File.rm_rf(state.hls_output_dir)
    end

    state = %{state | pipeline_pid: nil, transcription_client_pid: nil, last_status: :offline}
    {:status_change, :offline, state}
  end

  def handle_event(_state, _event), do: :ignore

  # -- Client connection (called by StreamManager when RTMPServer notifies) --

  @doc """
  Called when the RTMPServer detects an encoder connection for this user.
  Starts the Membrane pipeline and returns updated strategy state.
  """
  @spec handle_new_client(map(), pid()) :: map()
  def handle_new_client(state, client_ref) do
    Logger.info("[BroadcastStrategy.Membrane] starting pipeline for user #{state.user_id}")

    # Stop existing pipeline if any (reconnection scenario)
    if state.pipeline_pid do
      Pipeline.stop(state.pipeline_pid)
    end

    # Stop existing transcription client if any
    stop_transcription(state)

    # Ensure the HLS output directory exists before starting the pipeline
    File.rm_rf(state.hls_output_dir)
    File.mkdir_p!(state.hls_output_dir)

    # Start transcription client if enabled
    transcription_client_pid = maybe_start_transcription(state)

    pipeline_opts =
      if transcription_client_pid do
        [transcription_client_pid: transcription_client_pid]
      else
        []
      end

    case Pipeline.start(client_ref, state.stream_manager_pid, state.hls_output_dir, pipeline_opts) do
      {:ok, _supervisor_pid, pipeline_pid} ->
        Logger.info("[BroadcastStrategy.Membrane] pipeline started: #{inspect(pipeline_pid)}")
        # Monitor the pipeline so we detect crashes
        Process.monitor(pipeline_pid)

        %{
          state
          | pipeline_pid: pipeline_pid,
            transcription_client_pid: transcription_client_pid,
            last_status: :live
        }

      {:error, reason} ->
        Logger.error("[BroadcastStrategy.Membrane] failed to start pipeline: #{inspect(reason)}")
        # Clean up transcription client if pipeline failed
        if transcription_client_pid, do: Transcription.Client.stop(transcription_client_pid)
        state
    end
  end

  # -- Output Management --

  @impl true
  def add_output(state, %{rtmp_url: rtmp_url, stream_key: stream_key, platform: platform}) do
    if is_nil(state.pipeline_pid) do
      {:error, :no_pipeline}
    else
      handle = "membrane-#{platform}-#{String.slice(Ash.UUID.generate(), 0..7)}"

      :ok =
        Pipeline.add_output(state.pipeline_pid, handle, %{
          rtmp_url: rtmp_url,
          stream_key: stream_key,
          platform: platform
        })

      Logger.info("[BroadcastStrategy.Membrane] added output for #{platform}: #{handle}")

      state = put_in(state, [:outputs, handle], %{platform: platform})
      {:ok, handle, state}
    end
  end

  @impl true
  def remove_output(state, handle) do
    if state.pipeline_pid do
      Pipeline.remove_output(state.pipeline_pid, handle)
    end

    Logger.info("[BroadcastStrategy.Membrane] removed output: #{handle}")
    :ok
  end

  @impl true
  def cleanup_all_outputs(state) do
    if state.pipeline_pid do
      Pipeline.cleanup_all_outputs(state.pipeline_pid)
    end

    :ok
  end

  # -- Configuration --

  @impl true
  def build_stream_config(state, state_name) do
    input_streaming = state_name in [:ready, :streaming, :disconnected]

    %{
      horizontal_input: state.horizontal_input,
      vertical_input: state.vertical_input,
      live_outputs: state.outputs,
      stream_status: state_to_stream_status(state_name),
      input_streaming_status: if(input_streaming, do: :live, else: :offline),
      rtmp_url: state.horizontal_input.rtmp_url,
      horizontal_stream_key: state.stream_key,
      vertical_stream_key: state.stream_key,
      can_start_streaming: state_name == :ready,
      preview_hls_url: "/api/preview/#{state.user_id}/index.m3u8"
    }
  end

  @impl true
  def get_ingest_credentials(state, orientation) do
    input = if orientation == :vertical, do: state.vertical_input, else: state.horizontal_input

    {:ok,
     %{
       rtmp_url: input.rtmp_url,
       stream_key: input.stream_key,
       srt_url: input.srt_url,
       webrtc_url: input.webrtc_url
     }}
  end

  @impl true
  def regenerate_ingest_credentials(state, orientation) do
    # Generate new key
    random = 16 |> :crypto.strong_rand_bytes() |> Base.url_encode64(padding: false)
    new_stream_key = "#{state.user_id}-#{random}"

    host = Application.get_env(:streampai, :membrane_rtmp_host, "localhost")
    port = Application.get_env(:streampai, :membrane_rtmp_port, 1935)
    rtmp_url = "rtmp://#{host}:#{port}/live"

    data = %{"rtmp_url" => rtmp_url, "stream_key" => new_stream_key}

    # Update the DB record
    actor = Streampai.SystemActor.system()

    case MembraneLiveInput.get_or_create_for_user(state.user_id, orientation, actor: actor) do
      {:ok, [record]} ->
        case Ash.update(record, %{stream_key: new_stream_key, data: data}, actor: actor) do
          {:ok, _updated} ->
            new_input = %{
              input_id: new_stream_key,
              orientation: orientation,
              rtmp_url: rtmp_url,
              stream_key: new_stream_key,
              srt_url: nil,
              webrtc_url: nil
            }

            # Update state and re-register with RTMPServer if this is the active key
            new_state =
              if orientation == :vertical do
                %{state | vertical_input: new_input}
              else
                # Unregister old key, register new one
                RTMPServer.unregister_stream_key(state.stream_key)

                :ok =
                  RTMPServer.register_stream_key(
                    new_stream_key,
                    state.user_id,
                    state.stream_manager_pid
                  )

                %{state | horizontal_input: new_input, stream_key: new_stream_key}
              end

            {:ok,
             %{
               rtmp_url: rtmp_url,
               stream_key: new_stream_key,
               srt_url: nil,
               webrtc_url: nil
             }, new_state}

          {:error, reason} ->
            {:error, reason}
        end

      {:ok, []} ->
        {:error, :not_found}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @impl true
  def handle_input_deletion(_state), do: :ok

  # -- Teardown --

  @impl true
  def terminate(state) do
    Logger.info("[BroadcastStrategy.Membrane] terminating for user #{state.user_id}")

    # Stop transcription client
    stop_transcription(state)

    # Stop the pipeline
    if state.pipeline_pid do
      Pipeline.stop(state.pipeline_pid)
    end

    # Unregister the stream key
    RTMPServer.unregister_stream_key(state.stream_key)

    # Clean up HLS segments
    if state[:hls_output_dir] do
      File.rm_rf(state.hls_output_dir)
    end

    :ok
  rescue
    error ->
      Logger.warning("[BroadcastStrategy.Membrane] error during terminate: #{inspect(error)}")
      :ok
  end

  # -- Helpers --

  defp maybe_start_transcription(state) do
    if transcription_enabled?() do
      case Transcription.Client.start_link(state.user_id, callback_pid: self()) do
        {:ok, pid} ->
          Process.monitor(pid)
          Logger.info("[BroadcastStrategy.Membrane] transcription client started")
          pid

        {:error, reason} ->
          Logger.warning("[BroadcastStrategy.Membrane] failed to start transcription: #{inspect(reason)}")

          nil
      end
    end
  end

  defp stop_transcription(state) do
    if state[:transcription_client_pid] && Process.alive?(state.transcription_client_pid) do
      Transcription.Client.stop(state.transcription_client_pid)
    end
  rescue
    _ -> :ok
  end

  defp transcription_enabled? do
    Application.get_env(:streampai, :whisper_live_enabled, false)
  end

  defp state_to_stream_status(:initializing), do: :inactive
  defp state_to_stream_status(:offline), do: :inactive
  defp state_to_stream_status(:ready), do: :ready
  defp state_to_stream_status(:streaming), do: :streaming
  defp state_to_stream_status(:disconnected), do: :streaming
  defp state_to_stream_status(:stopping), do: :inactive
  defp state_to_stream_status(:error), do: :error
end
