defmodule StreampaiWeb.SyncController do
  @moduledoc """
  Controller for Electric SQL sync endpoints.

  SECURITY: Uses Ecto parameterized queries to prevent SQL injection.
  User IDs are bound as parameters using the ^pin operator, never interpolated.
  """
  use Phoenix.Controller, formats: [:json]

  import Ecto.Query
  import Phoenix.Sync.Controller

  alias Streampai.Accounts.StreamingAccount
  alias Streampai.Accounts.User
  alias Streampai.Accounts.UserRole
  alias Streampai.Accounts.WidgetConfig
  alias Streampai.Notifications.Notification
  alias Streampai.Notifications.NotificationRead
  alias Streampai.Stream.ChatMessage
  alias Streampai.Stream.Livestream
  alias Streampai.Stream.StreamEvent
  alias Streampai.Stream.StreamViewer

  # Safe columns to sync from users table (excludes sensitive data like hashed_password)
  @user_sync_columns [
    :id,
    :name,
    :email_notifications,
    :min_donation_amount,
    :max_donation_amount,
    :donation_currency,
    :default_voice,
    :avatar_url,
    :language_preference,
    :inserted_at,
    :updated_at
  ]

  # Admin-only columns for user management (includes email for identification)
  @admin_user_columns [
    :id,
    :email,
    :name,
    :confirmed_at,
    :avatar_url,
    :inserted_at,
    :updated_at
  ]

  def stream_events(conn, params) do
    sync_render(conn, params, StreamEvent)
  end

  def chat_messages(conn, params) do
    sync_render(conn, params, ChatMessage)
  end

  def livestreams(conn, params) do
    sync_render(conn, params, Livestream)
  end

  def viewers(conn, params) do
    sync_render(conn, params, StreamViewer)
  end

  def user_preferences(conn, params) do
    # Sync preference fields from users table instead of separate user_preferences table
    query = from(u in User, select: map(u, @user_sync_columns))
    sync_render(conn, params, query)
  end

  def admin_users(conn, params) do
    # Admin-only endpoint: sync all users for admin management
    # Authorization is handled by the router pipeline
    query = from(u in User, select: map(u, @admin_user_columns))
    sync_render(conn, params, query)
  end

  def widget_configs(conn, %{"user_id" => "_empty"} = params) do
    # Return empty result for placeholder requests (no logged in user)
    query = from(w in WidgetConfig, where: false)
    sync_render(conn, params, query)
  end

  def widget_configs(conn, %{"user_id" => user_id} = params) do
    case Ecto.UUID.cast(user_id) do
      {:ok, uuid} ->
        query = from(w in WidgetConfig, where: w.user_id == ^uuid)
        sync_render(conn, params, query)

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def notifications(conn, %{"user_id" => "_empty"} = params) do
    # Return empty result for placeholder requests (no logged in user)
    query = from(n in Notification, where: false)
    sync_render(conn, params, query)
  end

  def notifications(conn, %{"user_id" => user_id} = params) do
    case Ecto.UUID.cast(user_id) do
      {:ok, uuid} ->
        # Syncs notifications visible to a user: global (user_id IS NULL) OR user-specific
        query = from(n in Notification, where: is_nil(n.user_id) or n.user_id == ^uuid)
        sync_render(conn, params, query)

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def notification_reads(conn, %{"user_id" => "_empty"} = params) do
    # Return empty result for placeholder requests (no logged in user)
    query = from(nr in NotificationRead, where: false)
    sync_render(conn, params, query)
  end

  def notification_reads(conn, %{"user_id" => user_id} = params) do
    case Ecto.UUID.cast(user_id) do
      {:ok, uuid} ->
        query = from(nr in NotificationRead, where: nr.user_id == ^uuid)
        sync_render(conn, params, query)

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def global_notifications(conn, params) do
    # Syncs only global notifications (user_id IS NULL)
    query = from(n in Notification, where: is_nil(n.user_id))
    sync_render(conn, params, query)
  end

  def user_roles(conn, %{"user_id" => "_empty"} = params) do
    # Return empty result for placeholder requests (no logged in user)
    query = from(ur in UserRole, where: false)
    sync_render(conn, params, query)
  end

  def user_roles(conn, %{"user_id" => user_id} = params) do
    case Ecto.UUID.cast(user_id) do
      {:ok, uuid} ->
        # Syncs roles where the user is either the recipient (user_id) or the granter (granter_id)
        # This allows syncing both "roles I have" and "roles I've granted"
        query =
          from(ur in UserRole,
            where: (ur.user_id == ^uuid or ur.granter_id == ^uuid) and is_nil(ur.revoked_at)
          )

        sync_render(conn, params, query)

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def user_livestreams(conn, %{"user_id" => user_id} = params) do
    case Ecto.UUID.cast(user_id) do
      {:ok, uuid} ->
        query = from(l in Livestream, where: l.user_id == ^uuid)
        sync_render(conn, params, query)

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def user_stream_events(conn, %{"user_id" => user_id} = params) do
    case Ecto.UUID.cast(user_id) do
      {:ok, uuid} ->
        query = from(se in StreamEvent, where: se.user_id == ^uuid)
        sync_render(conn, params, query)

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def user_viewers(conn, %{"user_id" => user_id} = params) do
    case Ecto.UUID.cast(user_id) do
      {:ok, uuid} ->
        query = from(sv in StreamViewer, where: sv.user_id == ^uuid)
        sync_render(conn, params, query)

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def user_stream_viewers(conn, %{"user_id" => user_id} = params) do
    case Ecto.UUID.cast(user_id) do
      {:ok, uuid} ->
        query = from(sv in StreamViewer, where: sv.user_id == ^uuid)
        sync_render(conn, params, query)

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def user_chat_messages(conn, %{"user_id" => user_id} = params) do
    case Ecto.UUID.cast(user_id) do
      {:ok, uuid} ->
        query = from(cm in ChatMessage, where: cm.user_id == ^uuid)
        sync_render(conn, params, query)

      :error ->
        invalid_user_id_response(conn)
    end
  end

  # Safe columns to sync from streaming_account table (excludes sensitive tokens)
  @streaming_account_sync_columns [
    :user_id,
    :platform,
    :extra_data,
    :sponsor_count,
    :views_last_30d,
    :follower_count,
    :unique_viewers_last_30d,
    :stats_last_refreshed_at,
    :inserted_at,
    :updated_at
  ]

  def streaming_accounts(conn, %{"user_id" => "_empty"} = params) do
    # Return empty result for placeholder requests (no logged in user)
    query =
      from(sa in StreamingAccount, where: false, select: map(sa, @streaming_account_sync_columns))

    sync_render(conn, params, query)
  end

  def streaming_accounts(conn, %{"user_id" => user_id} = params) do
    case Ecto.UUID.cast(user_id) do
      {:ok, uuid} ->
        query =
          from(sa in StreamingAccount,
            where: sa.user_id == ^uuid,
            select: map(sa, @streaming_account_sync_columns)
          )

        sync_render(conn, params, query)

      :error ->
        invalid_user_id_response(conn)
    end
  end

  defp invalid_user_id_response(conn) do
    conn
    |> put_status(400)
    |> json(%{error: "Invalid user_id format"})
  end
end
