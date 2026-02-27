defmodule Streampai.LivestreamManager.Transcription.Sink do
  @moduledoc """
  Membrane Sink that receives raw PCM audio (float32, 16kHz, mono) and
  forwards it to a TranscriptionClient process for WhisperLive transcription.

  Uses `flow_control: :push` on its input pad so it never exerts backpressure
  on the upstream audio pipeline. If the TranscriptionClient is unavailable,
  buffers are silently dropped.
  """
  use Membrane.Sink

  alias Streampai.LivestreamManager.Transcription.Client, as: TranscriptionClient

  require Membrane.Logger

  def_input_pad(:input,
    flow_control: :auto,
    accepted_format: Membrane.RawAudio
  )

  def_options(
    client_pid: [
      spec: pid(),
      description: "PID of the TranscriptionClient GenServer"
    ]
  )

  @impl true
  def handle_init(_ctx, opts) do
    {[], %{client_pid: opts.client_pid}}
  end

  @impl true
  def handle_buffer(:input, buffer, _ctx, state) do
    if Process.alive?(state.client_pid) do
      TranscriptionClient.send_audio(state.client_pid, buffer.payload)
    end

    {[], state}
  end

  @impl true
  def handle_end_of_stream(:input, _ctx, state) do
    Membrane.Logger.info("Transcription audio stream ended")
    {[], state}
  end
end
