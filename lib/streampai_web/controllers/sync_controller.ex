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
  alias Streampai.Stream.CurrentStreamData
  alias Streampai.Stream.HighlightedMessage
  alias Streampai.Stream.Livestream
  alias Streampai.Stream.StreamEvent
  alias Streampai.Stream.StreamTimer
  alias Streampai.Stream.StreamViewer
  alias Streampai.Support.Message, as: SupportMessage
  alias Streampai.Support.Ticket, as: SupportTicket

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

  def livestreams(conn, params) do
    sync_render(conn, params, Livestream)
  end

  def viewers(conn, params) do
    sync_render(conn, params, StreamViewer)
  end

  def user_preferences(conn, %{"user_id" => user_id} = params) when is_binary(user_id) do
    {:ok, uuid} = Ecto.UUID.cast(user_id)
    query = from(u in User, where: u.id == ^uuid, select: map(u, @user_sync_columns))
    sync_render(conn, params, query)
  end

  def admin_users(conn, params) do
    # Admin-only endpoint: sync all users for admin management
    # Authorization is handled by the router pipeline
    query = from(u in User, select: map(u, @admin_user_columns))
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

  def highlighted_messages(conn, %{"user_id" => "_empty"} = params) do
    # Return empty result for placeholder requests (no logged in user)
    query = from(hm in HighlightedMessage, where: false)
    sync_render(conn, params, query)
  end

  def highlighted_messages(conn, %{"user_id" => user_id} = params) do
    case Ecto.UUID.cast(user_id) do
      {:ok, uuid} ->
        query = from(hm in HighlightedMessage, where: hm.user_id == ^uuid)
        sync_render(conn, params, query)

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def stream_timers(conn, %{"user_id" => user_id} = params) do
    case Ecto.UUID.cast(user_id) do
      {:ok, uuid} ->
        query = from(t in StreamTimer, where: t.user_id == ^uuid)
        sync_render(conn, params, query)

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def current_stream_data(conn, %{"user_id" => user_id} = params) do
    case Ecto.UUID.cast(user_id) do
      {:ok, uuid} ->
        query = from(c in CurrentStreamData, where: c.user_id == ^uuid)
        sync_render(conn, params, query)

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def support_tickets(conn, %{"user_id" => user_id} = params) do
    case Ecto.UUID.cast(user_id) do
      {:ok, uuid} ->
        query = from(t in SupportTicket, where: t.user_id == ^uuid)
        sync_render(conn, params, query)

      :error ->
        invalid_user_id_response(conn)
    end
  end

  def support_messages(conn, %{"ticket_id" => ticket_id} = params) do
    case Ecto.UUID.cast(ticket_id) do
      {:ok, uuid} ->
        query = from(m in SupportMessage, where: m.ticket_id == ^uuid)
        sync_render(conn, params, query)

      :error ->
        conn
        |> put_status(400)
        |> json(%{error: "Invalid ticket_id format"})
    end
  end

  def admin_support_tickets(conn, params) do
    sync_render(conn, params, SupportTicket)
  end

  def admin_support_messages(conn, params) do
    sync_render(conn, params, SupportMessage)
  end

  defp invalid_user_id_response(conn) do
    conn
    |> put_status(400)
    |> json(%{error: "Invalid user_id format"})
  end
end
