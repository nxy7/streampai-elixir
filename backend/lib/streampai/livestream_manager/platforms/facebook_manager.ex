defmodule Streampai.LivestreamManager.Platforms.FacebookManager do
  @moduledoc """
  Manages Facebook/Meta platform integration for live streaming.
  Currently a stub implementation - to be implemented in the future.
  """
  use GenServer
  require Logger

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, [])
  end

  @impl true
  def init(opts) do
    Logger.info("FacebookManager started (stub implementation)")
    {:ok, %{user_id: opts[:user_id], platform: :facebook}}
  end

  # Client API - Stub implementations

  def send_chat_message(_server, _message) do
    Logger.info("FacebookManager: send_chat_message called (stub)")
    :ok
  end

  def update_stream_metadata(_server, _metadata) do
    Logger.info("FacebookManager: update_stream_metadata called (stub)")
    :ok
  end

  # Server callbacks - Stub implementations

  @impl true
  def handle_call(request, _from, state) do
    Logger.info("FacebookManager: Unhandled call #{inspect(request)}")
    {:reply, :ok, state}
  end

  @impl true
  def handle_cast(request, state) do
    Logger.info("FacebookManager: Unhandled cast #{inspect(request)}")
    {:noreply, state}
  end

  @impl true
  def handle_info(msg, state) do
    Logger.info("FacebookManager: Unhandled info #{inspect(msg)}")
    {:noreply, state}
  end
end
