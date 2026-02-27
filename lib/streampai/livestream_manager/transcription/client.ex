defmodule Streampai.LivestreamManager.Transcription.Client do
  @moduledoc """
  WebSocket client for WhisperLive speech-to-text server.

  Connects to a WhisperLive instance, streams raw PCM audio (float32, 16kHz, mono),
  and receives transcription segments in real-time. Segments are logged to console.

  Uses `:gun` for WebSocket connectivity, following the same pattern as
  `Streampai.Twitch.EventsubClient`.
  """

  use GenServer

  require Logger

  @reconnect_delay 3_000
  @max_reconnect_delay 30_000
  @max_reconnect_attempts 5
  @server_ready_timeout 120_000

  defstruct [
    :user_id,
    :websocket_pid,
    :stream_ref,
    :callback_pid,
    :reconnect_timer_ref,
    :ready_timeout_ref,
    :ws_url,
    :ws_host,
    :ws_port,
    :ws_path,
    :ws_transport,
    server_ready: false,
    reconnect_attempts: 0,
    max_reconnect_attempts: @max_reconnect_attempts,
    last_segments: []
  ]

  ## Public API

  @doc """
  Starts the transcription client.

  ## Options
  - `:callback_pid` - Process to receive status notifications (optional)
  """
  @spec start_link(String.t(), keyword()) :: GenServer.on_start()
  def start_link(user_id, opts \\ []) do
    GenServer.start_link(__MODULE__, %{
      user_id: user_id,
      callback_pid: Keyword.get(opts, :callback_pid)
    })
  end

  @doc """
  Sends raw PCM audio data (float32, 16kHz, mono) to WhisperLive.
  Silently drops if not connected or server not ready.
  """
  @spec send_audio(pid(), binary()) :: :ok
  def send_audio(pid, pcm_binary) when is_binary(pcm_binary) do
    GenServer.cast(pid, {:send_audio, pcm_binary})
  end

  @doc "Gracefully stops the client, signaling end of audio."
  @spec stop(pid()) :: :ok
  def stop(pid) do
    GenServer.stop(pid, :normal)
  end

  ## GenServer Callbacks

  @impl true
  def init(%{user_id: user_id, callback_pid: callback_pid}) do
    Logger.metadata(user_id: user_id, component: :transcription_client)

    ws_url = Application.get_env(:streampai, :whisper_live_url, "ws://localhost:9090")
    uri = URI.parse(ws_url)

    {transport, default_port} =
      case uri.scheme do
        "wss" -> {:tls, 443}
        _ -> {:tcp, 80}
      end

    state = %__MODULE__{
      user_id: user_id,
      callback_pid: callback_pid,
      ws_url: ws_url,
      ws_host: uri.host || "localhost",
      ws_port: uri.port || default_port,
      ws_path: uri.path || "/",
      ws_transport: transport
    }

    send(self(), :connect)

    {:ok, state}
  end

  @impl true
  def handle_info(:connect, state) do
    Logger.info("[Transcription] Connecting to WhisperLive at #{state.ws_url}")

    case connect_websocket(state) do
      {:ok, ws_pid, stream_ref} ->
        new_state = %{state | websocket_pid: ws_pid, stream_ref: stream_ref}
        Logger.info("[Transcription] Connected to WhisperLive")

        # Send config immediately — the upgrade was consumed in connect_websocket,
        # so the gun_upgrade handle_info callback won't fire.
        send_config(new_state)

        if new_state.ready_timeout_ref, do: Process.cancel_timer(new_state.ready_timeout_ref)
        timeout_ref = Process.send_after(self(), :server_ready_timeout, @server_ready_timeout)

        {:noreply, %{new_state | ready_timeout_ref: timeout_ref}}

      {:error, reason} ->
        Logger.error("[Transcription] Failed to connect: #{inspect(reason)}")
        schedule_reconnect(state)
    end
  end

  @impl true
  def handle_info(:reconnect, state) do
    state = %{state | reconnect_timer_ref: nil}

    if state.reconnect_attempts < state.max_reconnect_attempts do
      Logger.info("[Transcription] Reconnecting (#{state.reconnect_attempts + 1}/#{state.max_reconnect_attempts})")

      cleanup_connection(state)
      send(self(), :connect)

      {:noreply,
       %{
         state
         | websocket_pid: nil,
           stream_ref: nil,
           server_ready: false,
           ready_timeout_ref: nil,
           reconnect_attempts: state.reconnect_attempts + 1
       }}
    else
      Logger.error("[Transcription] Max reconnection attempts reached, stopping")

      if state.callback_pid do
        send(state.callback_pid, {:transcription_stopped, :max_reconnects_reached})
      end

      {:stop, :normal, state}
    end
  end

  @impl true
  def handle_info(:server_ready_timeout, state) do
    if state.ready_timeout_ref && !state.server_ready do
      Logger.warning("[Transcription] Server ready timeout, reconnecting")
      schedule_reconnect(state)
    else
      {:noreply, state}
    end
  end

  # WebSocket upgrade success
  @impl true
  def handle_info({:gun_upgrade, _conn, _ref, ["websocket"], _headers}, state) do
    Logger.info("[Transcription] WebSocket upgraded, sending config")
    send_config(state)

    # Start timeout waiting for SERVER_READY
    if state.ready_timeout_ref, do: Process.cancel_timer(state.ready_timeout_ref)
    timeout_ref = Process.send_after(self(), :server_ready_timeout, @server_ready_timeout)

    {:noreply, %{state | ready_timeout_ref: timeout_ref}}
  end

  # Received text frame (JSON from WhisperLive)
  @impl true
  def handle_info({:gun_ws, _conn, _ref, {:text, message}}, state) do
    case Jason.decode(message) do
      {:ok, %{"message" => "SERVER_READY"}} ->
        if state.ready_timeout_ref, do: Process.cancel_timer(state.ready_timeout_ref)

        Logger.info("[Transcription] WhisperLive server ready, streaming audio")

        {:noreply, %{state | server_ready: true, ready_timeout_ref: nil, reconnect_attempts: 0}}

      {:ok, %{"segments" => segments}} when is_list(segments) ->
        state = handle_segments(segments, state)
        {:noreply, state}

      {:ok, %{"status" => "WAIT", "message" => msg}} ->
        Logger.info("[Transcription] Server says wait: #{msg}")
        {:noreply, state}

      {:ok, %{"status" => "ERROR", "message" => msg}} ->
        Logger.error("[Transcription] Server error: #{msg}")
        {:noreply, state}

      {:ok, %{"language" => lang, "language_prob" => prob}} ->
        Logger.info("[Transcription] Detected language: #{lang} (#{Float.round(prob * 100, 1)}%)")
        {:noreply, state}

      {:ok, other} ->
        Logger.debug("[Transcription] Unknown message: #{inspect(other)}")
        {:noreply, state}

      {:error, _} ->
        Logger.warning("[Transcription] Failed to parse message: #{String.slice(message, 0, 200)}")

        {:noreply, state}
    end
  end

  # WebSocket closed
  @impl true
  def handle_info({:gun_ws, _conn, _ref, {:close, code, reason}}, state) do
    Logger.warning("[Transcription] WebSocket closed: code=#{code} reason=#{reason}")
    schedule_reconnect(%{state | server_ready: false})
  end

  # Gun connection down
  @impl true
  def handle_info({:gun_down, _conn, _protocol, reason, _}, state) do
    Logger.warning("[Transcription] Connection down: #{inspect(reason)}")

    if state.reconnect_timer_ref do
      {:noreply, %{state | server_ready: false}}
    else
      schedule_reconnect(%{state | server_ready: false})
    end
  end

  @impl true
  def handle_info({:gun_up, _conn, _protocol}, state) do
    {:noreply, state}
  end

  @impl true
  def handle_info({:gun_response, _conn, _ref, _fin, _status, _headers}, state) do
    {:noreply, state}
  end

  @impl true
  def handle_info({:gun_error, _conn, _ref, reason}, state) do
    Logger.error("[Transcription] Gun error: #{inspect(reason)}")
    schedule_reconnect(%{state | server_ready: false})
  end

  @impl true
  def handle_info({:gun_error, _conn, reason}, state) do
    Logger.error("[Transcription] Gun connection error: #{inspect(reason)}")
    schedule_reconnect(%{state | server_ready: false})
  end

  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end

  # Send audio — only when connected and server is ready
  @impl true
  def handle_cast({:send_audio, pcm_binary}, %{server_ready: true, websocket_pid: ws} = state) when not is_nil(ws) do
    :gun.ws_send(ws, state.stream_ref, {:binary, pcm_binary})
    {:noreply, state}
  end

  def handle_cast({:send_audio, _pcm_binary}, state) do
    # Not connected or not ready — silently drop
    {:noreply, state}
  end

  @impl true
  def terminate(_reason, state) do
    # Signal end of audio if connected
    if state.websocket_pid && state.server_ready do
      try do
        :gun.ws_send(state.websocket_pid, state.stream_ref, {:text, "END_OF_AUDIO"})
      rescue
        _ -> :ok
      end
    end

    cleanup_connection(state)
    :ok
  end

  ## Private

  defp connect_websocket(state) do
    open_opts =
      case state.ws_transport do
        :tls ->
          %{
            protocols: [:http],
            transport: :tls,
            tls_opts: [
              verify: :verify_peer,
              cacertfile: to_charlist(CAStore.file_path()),
              customize_hostname_check: [
                match_fun: :public_key.pkix_verify_hostname_match_fun(:https)
              ]
            ]
          }

        :tcp ->
          %{protocols: [:http]}
      end

    with {:ok, conn_pid} <- :gun.open(to_charlist(state.ws_host), state.ws_port, open_opts),
         {:ok, _protocol} <- :gun.await_up(conn_pid, 5000) do
      stream_ref = :gun.ws_upgrade(conn_pid, to_charlist(state.ws_path))

      # Wait for upgrade in init — subsequent upgrades come as messages
      receive do
        {:gun_upgrade, ^conn_pid, ^stream_ref, ["websocket"], _headers} ->
          {:ok, conn_pid, stream_ref}

        {:gun_response, ^conn_pid, ^stream_ref, _fin, status, _headers} ->
          :gun.close(conn_pid)
          {:error, {:http_error, status}}

        {:gun_error, ^conn_pid, ^stream_ref, reason} ->
          :gun.close(conn_pid)
          {:error, reason}
      after
        5000 ->
          :gun.close(conn_pid)
          {:error, :upgrade_timeout}
      end
    end
  end

  defp send_config(state) do
    model = Application.get_env(:streampai, :whisper_live_model, "tiny")
    language = Application.get_env(:streampai, :whisper_live_language)

    config = %{
      uid: state.user_id,
      task: "transcribe",
      model: model,
      language: language,
      use_vad: false
    }

    Logger.info("[Transcription] Sending config: model=#{model}, language=#{language || "auto"}")
    :gun.ws_send(state.websocket_pid, state.stream_ref, {:text, Jason.encode!(config)})
  end

  defp handle_segments(segments, state) do
    # Build a fingerprint for each segment to detect changes.
    # WhisperLive sends its full segment list on every update, so we only log new/changed ones.
    current =
      Enum.map(segments, fn seg ->
        {seg["start"], seg["end"], String.trim(seg["text"] || ""), seg["completed"] || false}
      end)

    new_segments = current -- state.last_segments

    Enum.each(new_segments, fn {start_time, end_time, text, completed} ->
      if text != "" do
        prefix = if completed, do: "[FINAL]", else: "[partial]"

        Logger.info(
          "[Transcription] #{prefix} [#{format_time(start_time)}→#{format_time(end_time)}] #{text}",
          user_id: state.user_id
        )
      end
    end)

    %{state | last_segments: current}
  end

  defp format_time(nil), do: "?"

  defp format_time(seconds) when is_binary(seconds) do
    case Float.parse(seconds) do
      {num, _} -> format_time(num)
      :error -> seconds
    end
  end

  defp format_time(seconds) when is_number(seconds) do
    mins = trunc(seconds / 60)
    secs = Float.round(seconds - mins * 60, 1)
    "#{mins}:#{:io_lib.format("~5.1f", [secs])}"
  end

  defp schedule_reconnect(state) do
    if state.reconnect_timer_ref, do: Process.cancel_timer(state.reconnect_timer_ref)
    if state.ready_timeout_ref, do: Process.cancel_timer(state.ready_timeout_ref)

    delay = min(@reconnect_delay * (state.reconnect_attempts + 1), @max_reconnect_delay)
    timer_ref = Process.send_after(self(), :reconnect, delay)

    {:noreply,
     %{
       state
       | websocket_pid: nil,
         stream_ref: nil,
         server_ready: false,
         reconnect_timer_ref: timer_ref,
         ready_timeout_ref: nil
     }}
  end

  defp cleanup_connection(%{websocket_pid: nil}), do: :ok

  defp cleanup_connection(state) do
    :gun.close(state.websocket_pid)
  rescue
    _ -> :ok
  end
end
