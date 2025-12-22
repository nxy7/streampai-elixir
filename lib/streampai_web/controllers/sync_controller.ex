defmodule StreampaiWeb.SyncController do
  use Phoenix.Controller, formats: [:json]

  import Phoenix.Sync.Controller

  def stream_events(conn, params) do
    sync_render(conn, params, table: "stream_events")
  end

  def chat_messages(conn, params) do
    sync_render(conn, params, table: "chat_messages")
  end

  def livestreams(conn, params) do
    sync_render(conn, params, table: "livestreams")
  end

  def viewers(conn, params) do
    sync_render(conn, params, table: "viewers")
  end

  def user_preferences(conn, params) do
    sync_render(conn, params, table: "user_preferences")
  end
end
