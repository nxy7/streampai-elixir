defmodule StreampaiWeb.Utils.PubSubUtils do
  @moduledoc """
  Utilities for managing PubSub subscriptions and optimizing broadcast patterns.

  Provides consolidated subscription management, topic validation, and broadcast helpers
  to reduce boilerplate and improve consistency across the application.
  """

  alias Phoenix.PubSub

  @pubsub Streampai.PubSub

  # Topic prefix patterns for validation
  @valid_topic_prefixes [
    "donations:",
    "follows:",
    "subscriptions:",
    "raids:",
    "cheers:",
    "alertbox:",
    "alertqueue:",
    "stream_status:",
    "cloudflare_input:",
    "users_presence"
  ]

  @doc """
  Subscribes to multiple user-specific alert topics at once.
  Returns a list of {topic, result} tuples for debugging.
  """
  def subscribe_to_user_alerts(user_id) when is_binary(user_id) do
    alert_topics = [
      "donations:#{user_id}",
      "follows:#{user_id}",
      "subscriptions:#{user_id}",
      "raids:#{user_id}",
      "cheers:#{user_id}"
    ]

    subscribe_to_topics(alert_topics)
  end

  @doc """
  Subscribes to multiple topics and returns results.
  """
  def subscribe_to_topics(topics) when is_list(topics) do
    Enum.map(topics, fn topic ->
      result = PubSub.subscribe(@pubsub, topic)
      {topic, result}
    end)
  end

  @doc """
  Safely broadcasts a message to a topic with validation.
  """
  def safe_broadcast(topic, message) do
    if valid_topic?(topic) do
      PubSub.broadcast(@pubsub, topic, message)
    else
      {:error, :invalid_topic}
    end
  end

  @doc """
  Broadcasts a message and logs the result for debugging.
  """
  def broadcast_with_logging(topic, message, context \\ %{}) do
    result = safe_broadcast(topic, message)

    case result do
      :ok ->
        :ok

      {:error, reason} ->
        require Logger

        Logger.warning("Failed to broadcast PubSub message", %{
          topic: topic,
          reason: reason,
          context: context
        })

        {:error, reason}
    end
  end

  @doc """
  Broadcasts to a user's alertbox topic with standardized event format.
  """
  def broadcast_alert_event(user_id, event) when is_binary(user_id) do
    topic = "alertbox:#{user_id}"
    message = {:alert_event, event}

    broadcast_with_logging(topic, message, %{
      user_id: user_id,
      event_type: Map.get(event, :type, :unknown),
      event_id: Map.get(event, :id, "unknown")
    })
  end

  @doc """
  Broadcasts queue status updates to alertqueue subscribers.
  """
  def broadcast_queue_update(user_id, queue_data) when is_binary(user_id) do
    topic = "alertqueue:#{user_id}"
    message = {:queue_update, queue_data}

    broadcast_with_logging(topic, message, %{
      user_id: user_id,
      queue_length: Map.get(queue_data, :queue_length, 0),
      queue_state: Map.get(queue_data, :queue_state, :unknown)
    })
  end

  @doc """
  Broadcasts stream status changes with proper event structure.
  """
  def broadcast_stream_status(user_id, status_data) when is_binary(user_id) do
    topic = "stream_status:#{user_id}"
    message = {:stream_status_changed, status_data}

    broadcast_with_logging(topic, message, %{
      user_id: user_id,
      status: Map.get(status_data, :status, :unknown)
    })
  end

  @doc """
  Creates standardized user-specific topic names.
  """
  def user_topic(prefix, user_id) when is_binary(prefix) and is_binary(user_id) do
    "#{prefix}:#{user_id}"
  end

  @doc """
  Validates that a topic follows expected patterns.
  """
  def valid_topic?(topic) when is_binary(topic) do
    Enum.any?(@valid_topic_prefixes, fn prefix ->
      String.starts_with?(topic, prefix)
    end)
  end

  @doc """
  Batches multiple subscriptions for efficiency.
  Useful when subscribing to many topics in LiveView mount.
  """
  def batch_subscribe(subscriptions) when is_list(subscriptions) do
    results =
      Enum.map(subscriptions, fn
        {prefix, user_id} when is_binary(prefix) and is_binary(user_id) ->
          topic = user_topic(prefix, user_id)
          {topic, PubSub.subscribe(@pubsub, topic)}

        topic when is_binary(topic) ->
          {topic, PubSub.subscribe(@pubsub, topic)}
      end)

    failed_subscriptions =
      Enum.filter(results, fn {_topic, result} -> result != :ok end)

    if failed_subscriptions != [] do
      require Logger

      Logger.warning("Some PubSub subscriptions failed", %{
        failed: failed_subscriptions
      })
    end

    results
  end

  @doc """
  Unsubscribes from multiple topics at once.
  """
  def batch_unsubscribe(topics) when is_list(topics) do
    Enum.map(topics, fn topic ->
      {topic, PubSub.unsubscribe(@pubsub, topic)}
    end)
  end

  @doc """
  Gets metrics about PubSub usage for monitoring.
  """
  def get_pubsub_metrics do
    # This would require access to PubSub internals or custom tracking
    # For now, return a placeholder structure
    %{
      active_subscriptions: 0,
      total_topics: 0,
      broadcasts_per_minute: 0
    }
  end
end
