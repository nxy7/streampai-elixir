defmodule Streampai.Integrations.Discord.Notifier do
  @moduledoc """
  High-level API for sending Discord notifications.

  This module provides a clean interface for triggering Discord notifications
  from anywhere in the application. It automatically finds the appropriate
  webhooks and schedules the notifications through Oban.

  ## Usage

      # Notify about a donation
      Discord.Notifier.notify_donation(user_id, %{
        donor_name: "John",
        amount: "10.00",
        currency: "USD",
        message: "Great stream!"
      })

      # Notify about stream starting
      Discord.Notifier.notify_stream_start(user_id, %{
        title: "Playing some games!",
        platform: "twitch",
        category: "Just Chatting"
      })
  """

  alias Streampai.Jobs.DiscordNotificationJob

  @doc """
  Sends a donation notification to all configured Discord webhooks for the user.
  """
  def notify_donation(user_id, data) do
    DiscordNotificationJob.broadcast_to_user(user_id, :donation, data)
  end

  @doc """
  Sends a stream start notification to all configured Discord webhooks for the user.
  """
  def notify_stream_start(user_id, data) do
    DiscordNotificationJob.broadcast_to_user(user_id, :stream_start, data)
  end

  @doc """
  Sends a stream end notification to all configured Discord webhooks for the user.
  """
  def notify_stream_end(user_id, data) do
    DiscordNotificationJob.broadcast_to_user(user_id, :stream_end, data)
  end

  @doc """
  Sends a new follower notification to all configured Discord webhooks for the user.
  """
  def notify_new_follower(user_id, data) do
    DiscordNotificationJob.broadcast_to_user(user_id, :new_follower, data)
  end

  @doc """
  Sends a new subscriber notification to all configured Discord webhooks for the user.
  """
  def notify_new_subscriber(user_id, data) do
    DiscordNotificationJob.broadcast_to_user(user_id, :new_subscriber, data)
  end

  @doc """
  Sends a raid notification to all configured Discord webhooks for the user.
  """
  def notify_raid(user_id, data) do
    DiscordNotificationJob.broadcast_to_user(user_id, :raid, data)
  end

  @doc """
  Sends a host notification to all configured Discord webhooks for the user.
  """
  def notify_host(user_id, data) do
    DiscordNotificationJob.broadcast_to_user(user_id, :host, data)
  end

  @doc """
  Sends a poll created notification to all configured Discord webhooks for the user.
  """
  def notify_poll_created(user_id, data) do
    DiscordNotificationJob.broadcast_to_user(user_id, :poll_created, data)
  end

  @doc """
  Sends a poll ended notification to all configured Discord webhooks for the user.
  """
  def notify_poll_ended(user_id, data) do
    DiscordNotificationJob.broadcast_to_user(user_id, :poll_ended, data)
  end

  @doc """
  Sends a giveaway started notification to all configured Discord webhooks for the user.
  """
  def notify_giveaway_started(user_id, data) do
    DiscordNotificationJob.broadcast_to_user(user_id, :giveaway_started, data)
  end

  @doc """
  Sends a giveaway ended notification to all configured Discord webhooks for the user.
  """
  def notify_giveaway_ended(user_id, data) do
    DiscordNotificationJob.broadcast_to_user(user_id, :giveaway_ended, data)
  end

  @doc """
  Sends a generic notification for any event type.
  """
  def notify(user_id, event_type, data) do
    DiscordNotificationJob.broadcast_to_user(user_id, event_type, data)
  end
end
