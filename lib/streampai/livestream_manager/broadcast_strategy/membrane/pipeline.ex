defmodule Streampai.LivestreamManager.BroadcastStrategy.Membrane.Pipeline do
  @moduledoc """
  Per-user Membrane pipeline that receives RTMP ingest and relays to platform endpoints.

  Architecture:
    RTMP.SourceBin (demux) → Tee.Parallel (video) → RTMP.Sink (per platform)
                            → Tee.Parallel (audio) → RTMP.Sink (per platform)
                            → HLS SinkBin (FileStorage) — handles parsing + CMAF muxing internally

  The pipeline starts when an encoder connects and is terminated when it disconnects.
  It tracks bytes received for bitrate calculation and reports to the strategy process.
  HLS segments are written to a per-user directory for browser preview playback.
  """
  use Membrane.Pipeline

  alias Membrane.RTMP.SourceBin
  alias Membrane.Tee.Parallel
  alias Streampai.LivestreamManager.BroadcastStrategy.Membrane.TimestampOffset

  require Membrane.Logger

  @bitrate_report_interval_ms 2_000
  @hls_segment_duration_s 2

  @doc """
  Starts the pipeline for a given client_ref from the RTMPServer.

  Options:
  - `client_ref` — pid from `Membrane.RTMPServer` `handle_new_client` callback
  - `strategy_pid` — the StreamManager pid to send events to
  - `hls_output_dir` — directory path for HLS segments and manifests
  """
  @spec start(pid(), pid(), String.t(), keyword()) :: {:ok, pid(), pid()} | {:error, term()}
  def start(client_ref, strategy_pid, hls_output_dir, opts \\ []) do
    Membrane.Pipeline.start(__MODULE__, %{
      client_ref: client_ref,
      strategy_pid: strategy_pid,
      hls_output_dir: hls_output_dir,
      transcription_client_pid: Keyword.get(opts, :transcription_client_pid)
    })
  end

  @spec stop(pid()) :: :ok
  def stop(pipeline_pid) do
    Membrane.Pipeline.terminate(pipeline_pid)
    :ok
  rescue
    _ -> :ok
  end

  @doc "Add an RTMP output destination (platform relay)."
  @spec add_output(pid(), String.t(), %{
          rtmp_url: String.t(),
          stream_key: String.t(),
          platform: atom()
        }) :: :ok
  def add_output(pipeline_pid, handle, config) do
    send(pipeline_pid, {:add_output, handle, config})
    :ok
  end

  @doc "Remove an RTMP output destination."
  @spec remove_output(pid(), String.t()) :: :ok
  def remove_output(pipeline_pid, handle) do
    send(pipeline_pid, {:remove_output, handle})
    :ok
  end

  @doc "Remove all output destinations."
  @spec cleanup_all_outputs(pid()) :: :ok
  def cleanup_all_outputs(pipeline_pid) do
    send(pipeline_pid, :cleanup_all_outputs)
    :ok
  end

  # -- Pipeline callbacks --

  @impl true
  def handle_init(_ctx, opts) do
    hls_dir = opts.hls_output_dir

    # SourceBin outputs avc3 (parameter sets in-band, empty DCR).
    # H264.Parser converts to avc1 (full DCR with SPS/PPS) which is required
    # by RTMP.Sink — FFmpeg needs the SPS/PPS in extradata for valid FLV.
    spec =
      :source
      |> child(%SourceBin{client_ref: opts.client_ref})
      |> via_out(:video)
      |> child(:h264_parser, %Membrane.H264.Parser{
        output_stream_structure: :avc1,
        output_alignment: :au,
        repeat_parameter_sets: true
      })
      |> child(:video_tee, Parallel)

    audio_spec =
      :source
      |> get_child()
      |> via_out(:audio)
      |> child(:audio_tee, Parallel)

    # HLS preview output: video branch
    # SinkBin internally creates its own H264.Parser + CMAF muxer in :separate_av mode,
    # so we feed raw H264 from the tee directly into the bin's :input pad.
    hls_video_spec =
      :video_tee
      |> get_child()
      |> via_out(Pad.ref(:output, :hls_video))
      |> via_in(Pad.ref(:input, :video),
        options: [
          encoding: :H264,
          segment_duration: Membrane.Time.seconds(@hls_segment_duration_s)
        ]
      )
      |> child(:hls_sink, %Membrane.HTTPAdaptiveStream.SinkBin{
        manifest_name: "index",
        manifest_module: Membrane.HTTPAdaptiveStream.HLS,
        storage: %Membrane.HTTPAdaptiveStream.Storages.FileStorage{directory: hls_dir},
        target_window_duration: Membrane.Time.seconds(20),
        persist?: false,
        mode: :live,
        hls_mode: :separate_av
      })

    # HLS preview output: audio branch
    # Same as video — SinkBin creates its own AAC.Parser + CMAF muxer internally.
    hls_audio_spec =
      :audio_tee
      |> get_child()
      |> via_out(Pad.ref(:output, :hls_audio))
      |> via_in(Pad.ref(:input, :audio),
        options: [
          encoding: :AAC,
          segment_duration: Membrane.Time.seconds(@hls_segment_duration_s)
        ]
      )
      |> get_child(:hls_sink)

    # Transcription branch (optional, in its own crash group)
    # Decodes AAC → raw PCM, resamples to 16kHz mono f32le, forwards to TranscriptionClient.
    # Tee.PushOutput breaks the backpressure chain so transcription never slows relay.
    transcription_specs =
      if opts.transcription_client_pid do
        transcription_spec =
          :audio_tee
          |> get_child()
          |> via_out(Pad.ref(:output, :transcription))
          |> child(:transcription_push_tee, Membrane.Tee.PushOutput)
          |> child(:aac_parser, %Membrane.AAC.Parser{out_encapsulation: :ADTS})
          |> child(:aac_decoder, Membrane.AAC.FDK.Decoder)
          |> child(:audio_resampler, %Membrane.FFmpeg.SWResample.Converter{
            output_stream_format: %Membrane.RawAudio{
              sample_format: :f32le,
              sample_rate: 16_000,
              channels: 1
            }
          })
          |> child(:transcription_sink, %Streampai.LivestreamManager.Transcription.Sink{
            client_pid: opts.transcription_client_pid
          })

        [{transcription_spec, group: :transcription_group, crash_group_mode: :temporary}]
      else
        []
      end

    state = %{
      strategy_pid: opts.strategy_pid,
      hls_output_dir: hls_dir,
      outputs: %{},
      video_ready: false,
      audio_ready: false,
      bytes_received: 0,
      last_bitrate_time: System.monotonic_time(:millisecond),
      bitrate_timer: nil
    }

    base_specs = [spec: spec, spec: audio_spec, spec: hls_video_spec, spec: hls_audio_spec]
    all_specs = base_specs ++ Enum.map(transcription_specs, fn s -> {:spec, s} end)

    {all_specs, state}
  end

  @impl true
  def handle_setup(_ctx, state) do
    timer = Process.send_after(self(), :report_bitrate, @bitrate_report_interval_ms)
    {[], %{state | bitrate_timer: timer, video_ready: true, audio_ready: true}}
  end

  # Handle socket control transfer from SourceBin
  @impl true
  def handle_child_notification({:socket_control_needed, socket, source_pid}, :source, _ctx, state) do
    case SourceBin.pass_control(socket, source_pid) do
      :ok ->
        :ok

      {:error, reason} ->
        Membrane.Logger.warning("Failed to pass socket control: #{inspect(reason)}")
    end

    {[], state}
  end

  def handle_child_notification({:ssl_socket_control_needed, socket, source_pid}, :source, _ctx, state) do
    case SourceBin.secure_pass_control(socket, source_pid) do
      :ok ->
        :ok

      {:error, reason} ->
        Membrane.Logger.warning("Failed to pass SSL socket control: #{inspect(reason)}")
    end

    {[], state}
  end

  # Source stream ended (encoder disconnected)
  def handle_child_notification(:unexpected_socket_close, :source, _ctx, state) do
    Membrane.Logger.info("Encoder disconnected (unexpected socket close)")
    send(state.strategy_pid, {:strategy_event, :encoder_disconnected})
    {[], state}
  end

  def handle_child_notification(:stream_deleted, :source, _ctx, state) do
    Membrane.Logger.info("Encoder disconnected (stream deleted)")
    send(state.strategy_pid, {:strategy_event, :encoder_disconnected})
    {[], state}
  end

  def handle_child_notification({:stream_validation_success, _stage, _reason}, :source, _ctx, state) do
    Membrane.Logger.info("Stream validation success")
    {[], state}
  end

  def handle_child_notification({:stream_validation_error, _stage, reason}, :source, _ctx, state) do
    Membrane.Logger.warning("Stream validation error: #{inspect(reason)}")
    {[], state}
  end

  def handle_child_notification(_notification, _child, _ctx, state) do
    {[], state}
  end

  # -- Dynamic output management --

  @impl true
  def handle_info({:add_output, handle, config}, _ctx, state) do
    rtmp_url = "#{config.rtmp_url}/#{config.stream_key}"
    sink_name = String.to_atom("sink_#{handle}")
    offset_name = String.to_atom("offset_#{handle}")

    Membrane.Logger.info("Adding output #{handle} -> #{config.platform}, rtmp_url: #{rtmp_url}")

    # TimestampOffset resets both audio and video timestamps to start from zero,
    # preventing A/V desync when sinks join mid-stream.
    #
    # Wrapped in a crash group so a single failing sink doesn't take down the pipeline.
    group_id = String.to_atom("output_group_#{handle}")

    video_spec =
      :video_tee
      |> get_child()
      |> via_out(Pad.ref(:output, handle))
      |> via_in(Pad.ref(:input, :video))
      |> child(offset_name, TimestampOffset)
      |> via_out(Pad.ref(:output, :video))
      |> via_in(Pad.ref(:video, 0))
      |> child(sink_name, %Membrane.RTMP.Sink{
        rtmp_url: rtmp_url,
        max_attempts: 3,
        reset_timestamps: false
      })

    audio_spec =
      :audio_tee
      |> get_child()
      |> via_out(Pad.ref(:output, handle))
      |> via_in(Pad.ref(:input, :audio))
      |> get_child(offset_name)
      |> via_out(Pad.ref(:output, :audio))
      |> via_in(Pad.ref(:audio, 0))
      |> get_child(sink_name)

    spec = {[video_spec, audio_spec], group: group_id, crash_group_mode: :temporary}

    state =
      put_in(state, [:outputs, handle], %{
        sink_name: sink_name,
        offset_name: offset_name,
        group_id: group_id,
        platform: config.platform
      })

    {[spec: spec], state}
  end

  def handle_info({:remove_output, handle}, _ctx, state) do
    case Map.get(state.outputs, handle) do
      nil ->
        {[], state}

      %{sink_name: sink_name, offset_name: offset_name} ->
        Membrane.Logger.info("Removing output #{handle}")

        state = %{state | outputs: Map.delete(state.outputs, handle)}

        {[remove_children: [sink_name, offset_name]], state}
    end
  end

  def handle_info(:cleanup_all_outputs, _ctx, state) do
    children_to_remove =
      Enum.flat_map(state.outputs, fn {_handle, %{sink_name: sink_name, offset_name: offset_name}} ->
        [sink_name, offset_name]
      end)

    state = %{state | outputs: %{}}

    if children_to_remove == [] do
      {[], state}
    else
      {[remove_children: children_to_remove], state}
    end
  end

  # -- Bitrate tracking --

  def handle_info(:report_bitrate, _ctx, state) do
    now = System.monotonic_time(:millisecond)
    elapsed_ms = max(now - state.last_bitrate_time, 1)

    # bytes_received tracks total received since last report
    bitrate_kbps = round(state.bytes_received * 8 / elapsed_ms)

    if bitrate_kbps > 0 do
      send(state.strategy_pid, {:membrane_bitrate, bitrate_kbps})
    end

    timer = Process.send_after(self(), :report_bitrate, @bitrate_report_interval_ms)

    {[], %{state | bytes_received: 0, last_bitrate_time: now, bitrate_timer: timer}}
  end

  def handle_info(_msg, _ctx, state) do
    {[], state}
  end

  # -- Crash group isolation --

  @impl true
  def handle_crash_group_down(:transcription_group, _ctx, state) do
    Membrane.Logger.warning("Transcription crash group down. Transcription disabled for this session.")

    send(state.strategy_pid, {:transcription_crashed})
    {[], state}
  end

  def handle_crash_group_down(group_id, _ctx, state) do
    # Find which output this crash group belonged to
    {handle, output} =
      Enum.find(state.outputs, {nil, nil}, fn {_h, o} -> o.group_id == group_id end)

    if handle do
      Membrane.Logger.warning(
        "Crash group #{inspect(group_id)} down — platform #{output.platform}, handle #{handle}. " <>
          "Removing output from state."
      )

      state = %{state | outputs: Map.delete(state.outputs, handle)}
      send(state.strategy_pid, {:output_crashed, handle, output.platform})
      {[], state}
    else
      Membrane.Logger.warning("Unknown crash group down: #{inspect(group_id)}")
      {[], state}
    end
  end
end
