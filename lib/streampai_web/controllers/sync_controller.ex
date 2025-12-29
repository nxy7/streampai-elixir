defmodule StreampaiWeb.SyncController do
  @moduledoc """
  Controller for Electric SQL sync endpoints.

  SECURITY: All user_id parameters are validated as UUIDs before being used
  in queries to prevent SQL injection attacks.
  """
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
    "language_preference",
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

  # UUID regex pattern for validation (prevents SQL injection)
  @uuid_regex ~r/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  def widget_configs(conn, %{"user_id" => "_empty"} = params) do
    # Return empty result for placeholder requests (no logged in user)
    sync_render(conn, params,
      table: "widget_configs",
      where: "false"
    )
  end

  def widget_configs(conn, %{"user_id" => user_id} = params) do
    case validate_uuid(user_id) do
      {:ok, safe_user_id} ->
        sync_render(conn, params,
          table: "widget_configs",
          where: "user_id = '#{safe_user_id}'"
        )

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def notifications(conn, %{"user_id" => "_empty"} = params) do
    # Return empty result for placeholder requests (no logged in user)
    sync_render(conn, params,
      table: "notifications",
      where: "false"
    )
  end

  def notifications(conn, %{"user_id" => user_id} = params) do
    case validate_uuid(user_id) do
      {:ok, safe_user_id} ->
        sync_render(conn, params,
          table: "notifications",
          where: "user_id IS NULL OR user_id = '#{safe_user_id}'"
        )

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def notification_reads(conn, %{"user_id" => "_empty"} = params) do
    # Return empty result for placeholder requests (no logged in user)
    sync_render(conn, params,
      table: "notification_reads",
      where: "false"
    )
  end

  def notification_reads(conn, %{"user_id" => user_id} = params) do
    case validate_uuid(user_id) do
      {:ok, safe_user_id} ->
        sync_render(conn, params,
          table: "notification_reads",
          where: "user_id = '#{safe_user_id}'"
        )

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def global_notifications(conn, params) do
    # Syncs only global notifications (user_id IS NULL)
    sync_render(conn, params,
      table: "notifications",
      where: "user_id IS NULL"
    )
  end

  def user_roles(conn, %{"user_id" => "_empty"} = params) do
    # Return empty result for placeholder requests (no logged in user)
    sync_render(conn, params,
      table: "user_roles",
      where: "false"
    )
  end

  def user_roles(conn, %{"user_id" => user_id} = params) do
    case validate_uuid(user_id) do
      {:ok, safe_user_id} ->
        sync_render(conn, params,
          table: "user_roles",
          where: "(user_id = '#{safe_user_id}' OR granter_id = '#{safe_user_id}') AND revoked_at IS NULL"
        )

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def user_livestreams(conn, %{"user_id" => user_id} = params) do
    case validate_uuid(user_id) do
      {:ok, safe_user_id} ->
        sync_render(conn, params,
          table: "livestreams",
          where: "user_id = '#{safe_user_id}'"
        )

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def user_stream_events(conn, %{"user_id" => user_id} = params) do
    case validate_uuid(user_id) do
      {:ok, safe_user_id} ->
        sync_render(conn, params,
          table: "stream_events",
          where: "user_id = '#{safe_user_id}'"
        )

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def user_viewers(conn, %{"user_id" => user_id} = params) do
    case validate_uuid(user_id) do
      {:ok, safe_user_id} ->
        sync_render(conn, params,
          table: "stream_viewers",
          where: "user_id = '#{safe_user_id}'"
        )

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def user_stream_viewers(conn, %{"user_id" => user_id} = params) do
    case validate_uuid(user_id) do
      {:ok, safe_user_id} ->
        sync_render(conn, params,
          table: "stream_viewers",
          where: "user_id = '#{safe_user_id}'"
        )

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def user_chat_messages(conn, %{"user_id" => user_id} = params) do
    case validate_uuid(user_id) do
      {:ok, safe_user_id} ->
        sync_render(conn, params,
          table: "chat_messages",
          where: "user_id = '#{safe_user_id}'"
        )

      :error ->
        invalid_user_id_response(conn)
    end
  end

  # Safe columns to sync from streaming_account table (excludes sensitive tokens)
  @streaming_account_sync_columns [
    "user_id",
    "platform",
    "extra_data",
    "sponsor_count",
    "views_last_30d",
    "follower_count",
    "unique_viewers_last_30d",
    "stats_last_refreshed_at",
    "inserted_at",
    "updated_at"
  ]

  def streaming_accounts(conn, %{"user_id" => "_empty"} = params) do
    # Return empty result for placeholder requests (no logged in user)
    sync_render(conn, params,
      table: "streaming_account",
      columns: @streaming_account_sync_columns,
      where: "false"
    )
  end

  def streaming_accounts(conn, %{"user_id" => user_id} = params) do
    case validate_uuid(user_id) do
      {:ok, safe_user_id} ->
        sync_render(conn, params,
          table: "streaming_account",
          columns: @streaming_account_sync_columns,
          where: "user_id = '#{safe_user_id}'"
        )

      :error ->
        invalid_user_id_response(conn)
    end
  end

  # SECURITY: Validate that user_id is a valid UUID to prevent SQL injection
  # Only characters [0-9a-f-] are allowed in UUID format
  defp validate_uuid(user_id) when is_binary(user_id) do
    if Regex.match?(@uuid_regex, user_id) do
      {:ok, user_id}
    else
      :error
    end
  end

  defp validate_uuid(_), do: :error

  defp invalid_user_id_response(conn) do
    conn
    |> put_status(400)
    |> json(%{error: "Invalid user_id format"})
  end
end
