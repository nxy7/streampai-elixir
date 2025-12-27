defmodule Streampai.Integrations.IFTTT.Client do
  @moduledoc """
  HTTP client for IFTTT Webhooks API.

  Handles sending events to IFTTT webhooks with proper formatting
  and error handling.

  IFTTT Webhooks endpoint format:
  POST https://maker.ifttt.com/trigger/{event}/with/key/{key}

  Request body (optional):
  {
    "value1": "string",
    "value2": "string",
    "value3": "string"
  }

  IFTTT Webhooks are simpler than Discord - they accept up to 3 values
  that can be used in the resulting IFTTT action (email, SMS, etc).
  """
  require Logger

  @ifttt_webhook_base "https://maker.ifttt.com/trigger"

  @doc """
  Sends a test event to verify the webhook is configured correctly.
  """
  def send_test_event(%{webhook_key: webhook_key, event_name_prefix: prefix} = _webhook) do
    event_name = "#{prefix}_test"

    payload = %{
      value1: "Streampai Test",
      value2: "Your IFTTT webhook is configured correctly!",
      value3: DateTime.to_iso8601(DateTime.utc_now())
    }

    send_webhook(webhook_key, event_name, payload)
  end

  @doc """
  Sends an event to IFTTT for a specific streaming event type.
  """
  def send_event(webhook, event_type, data) do
    event_name = build_event_name(webhook.event_name_prefix, event_type)
    payload = build_payload_for_event(event_type, data)

    send_webhook(webhook.webhook_key, event_name, payload)
  end

  @doc """
  Sends a raw event to an IFTTT webhook.
  """
  def send_webhook(webhook_key, event_name, payload) when is_binary(webhook_key) do
    url = "#{@ifttt_webhook_base}/#{event_name}/with/key/#{webhook_key}"

    case Req.post(url, json: payload) do
      {:ok, %Req.Response{status: status}} when status in 200..299 ->
        {:ok, :sent}

      {:ok, %Req.Response{status: 401}} ->
        Logger.error("IFTTT webhook unauthorized - invalid key")
        {:error, :invalid_key}

      {:ok, %Req.Response{status: 429, headers: headers}} ->
        retry_after = get_retry_after(headers)
        Logger.warning("IFTTT webhook rate limited, retry after #{retry_after}s")
        {:error, {:rate_limited, retry_after}}

      {:ok, %Req.Response{status: status, body: body}} ->
        Logger.error("IFTTT webhook failed: status=#{status}, body=#{inspect(body)}")
        {:error, {:http_error, status, body}}

      {:error, exception} ->
        Logger.error("IFTTT webhook request failed: #{inspect(exception)}")
        {:error, {:request_failed, exception}}
    end
  end

  defp get_retry_after(headers) do
    headers
    |> Enum.find(fn {k, _v} -> String.downcase(k) == "retry-after" end)
    |> case do
      {_, value} -> String.to_integer(value)
      nil -> 60
    end
  end

  defp build_event_name(prefix, event_type) do
    "#{prefix}_#{event_type}"
  end

  @doc """
  Builds the IFTTT payload for a specific event type.

  IFTTT only supports value1, value2, value3 - so we pack the most useful info
  into these three fields based on event type.
  """
  def build_payload_for_event(:donation, data) do
    donor = Map.get(data, :donor_name) || Map.get(data, "donor_name", "Anonymous")
    amount = Map.get(data, :amount) || Map.get(data, "amount", "0")
    currency = Map.get(data, :currency) || Map.get(data, "currency", "USD")
    message = Map.get(data, :message) || Map.get(data, "message", "")

    %{
      value1: donor,
      value2: "#{currency} #{amount}",
      value3: message
    }
  end

  def build_payload_for_event(:stream_start, data) do
    title = Map.get(data, :title) || Map.get(data, "title", "Stream started")
    platform = Map.get(data, :platform) || Map.get(data, "platform", "Unknown")
    category = Map.get(data, :category) || Map.get(data, "category", "Just Chatting")

    %{
      value1: title,
      value2: platform,
      value3: category
    }
  end

  def build_payload_for_event(:stream_end, data) do
    title = Map.get(data, :title) || Map.get(data, "title", "Stream ended")

    duration =
      format_duration(Map.get(data, :duration_seconds) || Map.get(data, "duration_seconds", 0))

    peak_viewers = Map.get(data, :peak_viewers) || Map.get(data, "peak_viewers", 0)

    %{
      value1: title,
      value2: duration,
      value3: "Peak viewers: #{peak_viewers}"
    }
  end

  def build_payload_for_event(:new_follower, data) do
    username = Map.get(data, :username) || Map.get(data, "username", "Someone")
    platform = Map.get(data, :platform) || Map.get(data, "platform", "")

    %{
      value1: username,
      value2: "New follower",
      value3: platform
    }
  end

  def build_payload_for_event(:new_subscriber, data) do
    username = Map.get(data, :username) || Map.get(data, "username", "Someone")
    tier = Map.get(data, :tier) || Map.get(data, "tier", "1")
    months = Map.get(data, :months) || Map.get(data, "months", 1)

    %{
      value1: username,
      value2: "Tier #{tier}",
      value3: "#{months} month(s)"
    }
  end

  def build_payload_for_event(:raid, data) do
    raider = Map.get(data, :raider_name) || Map.get(data, "raider_name", "Someone")
    viewers = Map.get(data, :viewer_count) || Map.get(data, "viewer_count", 0)

    %{
      value1: raider,
      value2: "#{viewers} viewers",
      value3: "Raid incoming!"
    }
  end

  def build_payload_for_event(:host, data) do
    host = Map.get(data, :host_name) || Map.get(data, "host_name", "Someone")
    viewers = Map.get(data, :viewer_count) || Map.get(data, "viewer_count", 0)

    %{
      value1: host,
      value2: "#{viewers} viewers",
      value3: "Now hosting!"
    }
  end

  def build_payload_for_event(:poll_created, data) do
    title = Map.get(data, :title) || Map.get(data, "title", "New poll")
    options = Map.get(data, :options) || Map.get(data, "options", [])
    duration = Map.get(data, :duration_seconds) || Map.get(data, "duration_seconds", 60)

    %{
      value1: title,
      value2: Enum.join(options, ", "),
      value3: "#{duration} seconds"
    }
  end

  def build_payload_for_event(:poll_ended, data) do
    title = Map.get(data, :title) || Map.get(data, "title", "Poll ended")
    winner = Map.get(data, :winner) || Map.get(data, "winner", "N/A")
    total_votes = Map.get(data, :total_votes) || Map.get(data, "total_votes", 0)

    %{
      value1: title,
      value2: "Winner: #{winner}",
      value3: "#{total_votes} votes"
    }
  end

  def build_payload_for_event(:giveaway_started, data) do
    title = Map.get(data, :title) || Map.get(data, "title", "Giveaway started")
    prize = Map.get(data, :prize) || Map.get(data, "prize", "Unknown")
    duration = Map.get(data, :duration_minutes) || Map.get(data, "duration_minutes", 5)

    %{
      value1: title,
      value2: "Prize: #{prize}",
      value3: "#{duration} minutes"
    }
  end

  def build_payload_for_event(:giveaway_ended, data) do
    winner = Map.get(data, :winner_name) || Map.get(data, "winner_name", "Someone")
    prize = Map.get(data, :prize) || Map.get(data, "prize", "Unknown")
    entries = Map.get(data, :total_entries) || Map.get(data, "total_entries", 0)

    %{
      value1: "Winner: #{winner}",
      value2: "Prize: #{prize}",
      value3: "#{entries} entries"
    }
  end

  def build_payload_for_event(event_type, data) do
    # Fallback for unknown event types
    %{
      value1: to_string(event_type),
      value2: data |> Jason.encode!() |> String.slice(0, 200),
      value3: DateTime.to_iso8601(DateTime.utc_now())
    }
  end

  defp format_duration(seconds) when is_integer(seconds) do
    hours = div(seconds, 3600)
    minutes = div(rem(seconds, 3600), 60)
    secs = rem(seconds, 60)

    cond do
      hours > 0 -> "#{hours}h #{minutes}m"
      minutes > 0 -> "#{minutes}m #{secs}s"
      true -> "#{secs}s"
    end
  end

  defp format_duration(_), do: "Unknown"
end
