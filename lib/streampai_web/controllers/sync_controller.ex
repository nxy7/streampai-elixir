defmodule StreampaiWeb.SyncController do
  use Phoenix.Controller, formats: [:json]

  import Phoenix.Sync.Controller

  # Safe columns to sync from users table (excludes sensitive data like hashed_password)
  @user_sync_columns [
    "id",
    "name",
    "email_notifications",
    "min_donation_amount",
    "max_donation_amount",
    "donation_currency",
    "default_voice",
    "avatar_url",
    "inserted_at",
    "updated_at"
  ]

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
    # Sync preference fields from users table instead of separate user_preferences table
    sync_render(conn, params, table: "users", columns: @user_sync_columns)
  end
end
