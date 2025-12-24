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

  # Admin-only columns for user management (includes email for identification)
  @admin_user_columns [
    "id",
    "email",
    "name",
    "confirmed_at",
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

  def admin_users(conn, params) do
    # Admin-only endpoint: sync all users for admin management
    # Authorization is handled by the router pipeline
    sync_render(conn, params, table: "users", columns: @admin_user_columns)
  end

  def widget_configs(conn, %{"user_id" => user_id} = params) do
    # User-scoped widget configs - syncs all widget configs for a specific user
    sync_render(conn, params,
      table: "widget_configs",
      where: "user_id = '#{user_id}'"
    )
  end

  def notifications(conn, %{"user_id" => user_id} = params) do
    # Syncs notifications visible to a user: global (user_id IS NULL) OR user-specific
    sync_render(conn, params,
      table: "notifications",
      where: "user_id IS NULL OR user_id = '#{user_id}'"
    )
  end

  def notification_reads(conn, %{"user_id" => user_id} = params) do
    # Syncs notification read status for a specific user
    sync_render(conn, params,
      table: "notification_reads",
      where: "user_id = '#{user_id}'"
    )
  end

  def global_notifications(conn, params) do
    # Syncs only global notifications (user_id IS NULL)
    sync_render(conn, params,
      table: "notifications",
      where: "user_id IS NULL"
    )
  end

  def user_roles(conn, %{"user_id" => user_id} = params) do
    # Syncs roles where the user is either the recipient (user_id) or the granter (granter_id)
    # This allows syncing both "roles I have" and "roles I've granted"
    sync_render(conn, params,
      table: "user_roles",
      where: "(user_id = '#{user_id}' OR granter_id = '#{user_id}') AND revoked_at IS NULL"
    )
  end

  def user_livestreams(conn, %{"user_id" => user_id} = params) do
    # User-scoped livestreams - syncs completed streams for a specific user
    sync_render(conn, params,
      table: "livestreams",
      where: "user_id = '#{user_id}' AND ended_at IS NOT NULL"
    )
  end

  def user_stream_viewers(conn, %{"user_id" => user_id} = params) do
    # User-scoped stream viewers - syncs all viewers for a specific streamer
    sync_render(conn, params,
      table: "stream_viewers",
      where: "user_id = '#{user_id}'"
    )
  end

  def user_chat_messages(conn, %{"user_id" => user_id} = params) do
    # User-scoped chat messages - syncs all chat messages for a specific streamer
    sync_render(conn, params,
      table: "chat_messages",
      where: "user_id = '#{user_id}'"
    )
  end

  def livestream_metrics(conn, %{"user_id" => user_id} = params) do
    # User-scoped livestream metrics - syncs metrics for all streams of a specific user
    sync_render(conn, params,
      table: "livestream_metrics",
      where: "livestream_id IN (SELECT id FROM livestreams WHERE user_id = '#{user_id}')"
    )
  end
end
