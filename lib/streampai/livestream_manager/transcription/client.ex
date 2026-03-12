defmodule Streampai.LivestreamManager.Transcription.Client do
  @moduledoc """
  Transcription client using Bumblebee Whisper.

  Buffers raw PCM audio (float32, 16kHz, mono) and periodically runs
  inference via the global `Streampai.WhisperServing` Nx.Serving process.
  Transcription segments are logged to console.
  """

  use GenServer

  require Logger

  @sample_rate 16_000
  # Process audio every N milliseconds
  @process_interval_ms 5_000
  # Minimum seconds of audio before processing
  @min_audio_seconds 1.0

  defstruct [
    :user_id,
    :callback_pid,
    :process_timer,
    audio_buffer: <<>>,
    segment_offset: 0.0,
    segments: []
  ]

  ## Public API

  @spec start_link(String.t(), keyword()) :: GenServer.on_start()
  def start_link(user_id, opts \\ []) do
    GenServer.start_link(__MODULE__, %{
      user_id: user_id,
      callback_pid: Keyword.get(opts, :callback_pid)
    })
  end

  @spec send_audio(pid(), binary()) :: :ok
  def send_audio(pid, pcm_binary) when is_binary(pcm_binary) do
    GenServer.cast(pid, {:send_audio, pcm_binary})
  end

  @spec stop(pid()) :: :ok
  def stop(pid) do
    GenServer.stop(pid, :normal)
  end

  ## GenServer Callbacks

  @impl true
  def init(%{user_id: user_id, callback_pid: callback_pid}) do
    Logger.metadata(user_id: user_id, component: :transcription_client)
    Logger.info("[Transcription] Bumblebee client started for user #{user_id}")

    timer = Process.send_after(self(), :process_audio, @process_interval_ms)

    {:ok,
     %__MODULE__{
       user_id: user_id,
       callback_pid: callback_pid,
       process_timer: timer
     }}
  end

  @impl true
  def handle_cast({:send_audio, pcm_binary}, state) do
    {:noreply, %{state | audio_buffer: state.audio_buffer <> pcm_binary}}
  end

  @impl true
  def handle_info(:process_audio, state) do
    state = maybe_transcribe(state)
    timer = Process.send_after(self(), :process_audio, @process_interval_ms)
    {:noreply, %{state | process_timer: timer}}
  end

  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end

  @impl true
  def terminate(_reason, state) do
    if state.process_timer, do: Process.cancel_timer(state.process_timer)

    # Process any remaining audio
    _state = maybe_transcribe(state)
    :ok
  end

  ## Private

  defp maybe_transcribe(state) do
    # Each float32 sample = 4 bytes
    min_bytes = trunc(@min_audio_seconds * @sample_rate * 4)

    if byte_size(state.audio_buffer) >= min_bytes do
      run_inference(state)
    else
      state
    end
  end

  defp run_inference(state) do
    audio_binary = state.audio_buffer
    num_samples = div(byte_size(audio_binary), 4)
    duration = num_samples / @sample_rate

    # Convert float32 PCM binary to Nx tensor
    audio_tensor = Nx.from_binary(audio_binary, :f32)

    try do
      %{chunks: chunks} = Nx.Serving.batched_run(Streampai.WhisperServing, audio_tensor)

      new_segments =
        Enum.flat_map(chunks, fn chunk ->
          start_time = (chunk[:start_timestamp_seconds] || 0.0) + state.segment_offset
          end_time = (chunk[:end_timestamp_seconds] || duration) + state.segment_offset
          text = String.trim(chunk.text)

          if text != "" do
            Logger.info(
              "[Transcription] [FINAL] [#{format_time(start_time)}->#{format_time(end_time)}] #{text}",
              user_id: state.user_id
            )

            [%{start: start_time, end: end_time, text: text}]
          else
            []
          end
        end)

      %{
        state
        | audio_buffer: <<>>,
          segment_offset: state.segment_offset + duration,
          segments: state.segments ++ new_segments
      }
    rescue
      error ->
        Logger.error("[Transcription] Inference error: #{inspect(error)}")
        %{state | audio_buffer: <<>>}
    end
  end

  defp format_time(seconds) when is_number(seconds) do
    mins = trunc(seconds / 60)
    secs = Float.round(seconds - mins * 60, 1)
    "#{mins}:#{:io_lib.format("~5.1f", [secs])}"
  end

  defp format_time(_), do: "?"
end
