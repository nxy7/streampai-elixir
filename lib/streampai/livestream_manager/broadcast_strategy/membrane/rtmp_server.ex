defmodule Streampai.LivestreamManager.BroadcastStrategy.Membrane.RTMPServer do
  @moduledoc """
  Manages a singleton `Membrane.RTMPServer` instance for self-hosted RTMP ingest.

  Each user registers a unique stream key. When an encoder connects, the server
  looks up the stream key and notifies the user's StreamManager process so it can
  start the Membrane pipeline.
  """
  use GenServer

  require Logger

  @default_port 1935

  # -- Client API --

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc "Register a stream key for a user. The `stream_manager_pid` receives `{:membrane_client_connected, client_ref}` on connect."
  @spec register_stream_key(String.t(), String.t(), pid()) :: :ok
  def register_stream_key(stream_key, user_id, stream_manager_pid) do
    GenServer.call(__MODULE__, {:register, stream_key, user_id, stream_manager_pid})
  end

  @doc "Unregister a stream key."
  @spec unregister_stream_key(String.t()) :: :ok
  def unregister_stream_key(stream_key) do
    GenServer.call(__MODULE__, {:unregister, stream_key})
  end

  @doc "Returns the port the RTMP server is listening on."
  @spec get_port() :: :inet.port_number()
  def get_port do
    GenServer.call(__MODULE__, :get_port)
  end

  # -- Server --

  @impl true
  def init(_opts) do
    port = Application.get_env(:streampai, :membrane_rtmp_port, @default_port)

    # We store the mapping ourselves and pass a closure to the RTMPServer.
    # The closure sends a message back to this GenServer, which then looks up
    # the stream key and forwards to the correct StreamManager.
    parent = self()

    handle_new_client = fn client_ref, app, stream_key ->
      send(parent, {:new_client, client_ref, app, stream_key})

      # Return the ClientHandler behaviour module.
      # Membrane.RTMP.Source.ClientHandlerImpl is the default handler used
      # by SourceBin — it bridges data from the TCP socket into the Source element.
      Membrane.RTMP.Source.ClientHandlerImpl
    end

    case Membrane.RTMPServer.start_link(
           port: port,
           handle_new_client: handle_new_client,
           client_timeout: Membrane.Time.seconds(15)
         ) do
      {:ok, server_pid} ->
        actual_port = Membrane.RTMPServer.get_port(server_pid)
        Logger.info("[Membrane.RTMPServer] listening on port #{actual_port}")

        {:ok,
         %{
           server_pid: server_pid,
           port: actual_port,
           stream_keys: %{}
         }}

      {:error, reason} ->
        Logger.error("[Membrane.RTMPServer] failed to start: #{inspect(reason)}")
        {:stop, reason}
    end
  end

  @impl true
  def handle_call({:register, stream_key, user_id, stream_manager_pid}, _from, state) do
    Logger.info("[Membrane.RTMPServer] registered key #{String.slice(stream_key, 0..7)}... for user #{user_id}")

    state =
      put_in(state, [:stream_keys, stream_key], %{user_id: user_id, pid: stream_manager_pid})

    {:reply, :ok, state}
  end

  def handle_call({:unregister, stream_key}, _from, state) do
    Logger.info("[Membrane.RTMPServer] unregistered key #{String.slice(stream_key, 0..7)}...")

    state = %{state | stream_keys: Map.delete(state.stream_keys, stream_key)}
    {:reply, :ok, state}
  end

  def handle_call(:get_port, _from, state) do
    {:reply, state.port, state}
  end

  @impl true
  def handle_info({:new_client, client_ref, _app, stream_key}, state) do
    case Map.get(state.stream_keys, stream_key) do
      nil ->
        Logger.warning("[Membrane.RTMPServer] unknown stream key: #{String.slice(stream_key, 0..7)}...")

      %{user_id: user_id, pid: stream_manager_pid} ->
        Logger.info("[Membrane.RTMPServer] encoder connected for user #{user_id}")
        send(stream_manager_pid, {:membrane_client_connected, client_ref})
    end

    {:noreply, state}
  end

  def handle_info(msg, state) do
    Logger.debug("[Membrane.RTMPServer] unhandled message: #{inspect(msg)}")
    {:noreply, state}
  end
end
