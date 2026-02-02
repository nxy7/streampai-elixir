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
  alias Streampai.Stream.ChatBotConfig
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

  def stream_events(conn, params) do
    sync_render(conn, params, StreamEvent)
  end

  def livestreams(conn, params) do
    sync_render(conn, params, Livestream)
  end

  def viewers(conn, params) do
    sync_render(conn, params, StreamViewer)
  end

  def user_preferences(conn, %{"user_id" => user_id} = params) do
    with_valid_uuid(conn, user_id, fn uuid ->
      query = from(u in User, where: u.id == ^uuid, select: map(u, @user_sync_columns))
      sync_render(conn, params, query)
    end)
  end

  def admin_users(conn, params) do
    query = from(u in User, select: map(u, @admin_user_columns))
    sync_render(conn, params, query)
  end

  def widget_configs(conn, %{"user_id" => user_id} = params) do
    with_valid_uuid(conn, user_id, fn uuid ->
      sync_render(conn, params, from(w in WidgetConfig, where: w.user_id == ^uuid))
    end)
  end

  def notifications(conn, %{"user_id" => user_id} = params) do
    with_valid_uuid(conn, user_id, fn uuid ->
      query = from(n in Notification, where: is_nil(n.user_id) or n.user_id == ^uuid)
      sync_render(conn, params, query)
    end)
  end

  def notification_reads(conn, %{"user_id" => user_id} = params) do
    with_valid_uuid(conn, user_id, fn uuid ->
      sync_render(conn, params, from(nr in NotificationRead, where: nr.user_id == ^uuid))
    end)
  end

  def global_notifications(conn, params) do
    query = from(n in Notification, where: is_nil(n.user_id))
    sync_render(conn, params, query)
  end

  def user_roles(conn, %{"user_id" => user_id} = params) do
    with_valid_uuid(conn, user_id, fn uuid ->
      query =
        from(ur in UserRole,
          where: (ur.user_id == ^uuid or ur.granter_id == ^uuid) and is_nil(ur.revoked_at)
        )

      sync_render(conn, params, query)
    end)
  end

  def user_livestreams(conn, %{"user_id" => user_id} = params) do
    with_valid_uuid(conn, user_id, fn uuid ->
      sync_render(conn, params, from(l in Livestream, where: l.user_id == ^uuid))
    end)
  end

  def user_stream_events(conn, %{"user_id" => user_id} = params) do
    with_valid_uuid(conn, user_id, fn uuid ->
      sync_render(conn, params, from(se in StreamEvent, where: se.user_id == ^uuid))
    end)
  end

  def user_viewers(conn, %{"user_id" => user_id} = params) do
    with_valid_uuid(conn, user_id, fn uuid ->
      sync_render(conn, params, from(sv in StreamViewer, where: sv.user_id == ^uuid))
    end)
  end

  def streaming_accounts(conn, %{"user_id" => user_id} = params) do
    with_valid_uuid(conn, user_id, fn uuid ->
      query =
        from(sa in StreamingAccount,
          where: sa.user_id == ^uuid,
          select: map(sa, @streaming_account_sync_columns)
        )

      sync_render(conn, params, query)
    end)
  end

  def highlighted_messages(conn, %{"user_id" => "_empty"} = params) do
    query = from(hm in HighlightedMessage, where: false)
    sync_render(conn, params, query)
  end

  def highlighted_messages(conn, %{"user_id" => user_id} = params) do
    with_valid_uuid(conn, user_id, fn uuid ->
      sync_render(conn, params, from(hm in HighlightedMessage, where: hm.user_id == ^uuid))
    end)
  end

  def stream_timers(conn, %{"user_id" => user_id} = params) do
    with_valid_uuid(conn, user_id, fn uuid ->
      sync_render(conn, params, from(t in StreamTimer, where: t.user_id == ^uuid))
    end)
  end

  def chat_bot_configs(conn, %{"user_id" => user_id} = params) do
    with_valid_uuid(conn, user_id, fn uuid ->
      sync_render(conn, params, from(c in ChatBotConfig, where: c.user_id == ^uuid))
    end)
  end

  def current_stream_data(conn, %{"user_id" => user_id} = params) do
    with_valid_uuid(conn, user_id, fn uuid ->
      sync_render(conn, params, from(c in CurrentStreamData, where: c.user_id == ^uuid))
    end)
  end

  def support_tickets(conn, %{"user_id" => user_id} = params) do
    with_valid_uuid(conn, user_id, fn uuid ->
      sync_render(conn, params, from(t in SupportTicket, where: t.user_id == ^uuid))
    end)
  end

  def support_messages(conn, %{"ticket_id" => ticket_id} = params) do
    case Ecto.UUID.cast(ticket_id) do
      {:ok, uuid} ->
        sync_render(conn, params, from(m in SupportMessage, where: m.ticket_id == ^uuid))

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

  defp with_valid_uuid(conn, id, fun) do
    case Ecto.UUID.cast(id) do
      {:ok, uuid} -> fun.(uuid)
      :error -> invalid_user_id_response(conn)
    end
  end

  defp invalid_user_id_response(conn) do
    conn
    |> put_status(400)
    |> json(%{error: "Invalid user_id format"})
  end
end
