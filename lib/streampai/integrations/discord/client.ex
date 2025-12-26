defmodule Streampai.Integrations.Discord.Client do
  @moduledoc """
  HTTP client for Discord webhook API.

  Handles sending messages to Discord webhooks with proper formatting,
  rate limiting awareness, and error handling.

  Discord webhook rate limits:
  - 30 requests per 60 seconds per webhook
  - 5 requests per 2 seconds burst limit
  """
  require Logger

  @discord_webhook_base "https://discord.com/api/webhooks"
  @default_username "Streampai"
  @default_avatar_url "https://streampai.com/logo.png"

  @doc """
  Sends a test message to verify the webhook is configured correctly.
  """
  def send_test_message(%{webhook_url: webhook_url} = webhook) do
    embed = %{
      title: "Streampai Connected!",
      description: "Your Discord webhook is configured correctly and ready to receive notifications.",
      color: 0x5865F2,
      timestamp: DateTime.to_iso8601(DateTime.utc_now()),
      footer: %{
        text: "Webhook: #{webhook.name}"
      },
      fields: [
        %{
          name: "Enabled Events",
          value: format_event_types(webhook.event_types),
          inline: false
        }
      ]
    }

    send_webhook(webhook_url, %{
      username: @default_username,
      avatar_url: @default_avatar_url,
      embeds: [embed]
    })
  end

  @doc """
  Sends a notification to a Discord webhook for a specific event type.
  """
  def send_notification(webhook, event_type, data) do
    embed = build_embed_for_event(webhook, event_type, data)

    send_webhook(webhook.webhook_url, %{
      username: @default_username,
      avatar_url: @default_avatar_url,
      embeds: [embed]
    })
  end

  @doc """
  Sends a raw message payload to a Discord webhook.
  """
  def send_webhook(webhook_url, payload) when is_binary(webhook_url) do
    if valid_webhook_url?(webhook_url) do
      do_send_webhook(webhook_url, payload)
    else
      {:error, :invalid_webhook_url}
    end
  end

  defp do_send_webhook(webhook_url, payload) do
    case Req.post(webhook_url, json: payload) do
      {:ok, %Req.Response{status: status}} when status in 200..299 ->
        {:ok, :sent}

      {:ok, %Req.Response{status: 429, body: body}} ->
        retry_after = get_in(body, ["retry_after"]) || 5
        Logger.warning("Discord webhook rate limited, retry after #{retry_after}s")
        {:error, {:rate_limited, retry_after}}

      {:ok, %Req.Response{status: status, body: body}} ->
        Logger.error("Discord webhook failed: status=#{status}, body=#{inspect(body)}")
        {:error, {:http_error, status, body}}

      {:error, exception} ->
        Logger.error("Discord webhook request failed: #{inspect(exception)}")
        {:error, {:request_failed, exception}}
    end
  end

  defp valid_webhook_url?(url) when is_binary(url) do
    String.starts_with?(url, @discord_webhook_base)
  end

  defp valid_webhook_url?(_), do: false

  defp build_embed_for_event(webhook, :donation, data) do
    base_embed = %{
      title: "New Donation!",
      color: 0x00FF00,
      timestamp: DateTime.to_iso8601(DateTime.utc_now()),
      thumbnail: %{
        url: data[:avatar_url] || @default_avatar_url
      }
    }

    fields = []

    fields =
      if Map.get(data, :donor_name) do
        [%{name: "From", value: data.donor_name, inline: true} | fields]
      else
        fields
      end

    fields =
      if webhook.include_amount and Map.get(data, :amount) do
        currency = Map.get(data, :currency, "USD")
        [%{name: "Amount", value: "#{currency} #{data.amount}", inline: true} | fields]
      else
        fields
      end

    fields =
      if webhook.include_message and Map.get(data, :message) and data.message != "" do
        [%{name: "Message", value: data.message, inline: false} | fields]
      else
        fields
      end

    Map.put(base_embed, :fields, Enum.reverse(fields))
  end

  defp build_embed_for_event(_webhook, :stream_start, data) do
    %{
      title: "Stream Started!",
      description: Map.get(data, :title, "A new stream has started"),
      color: 0x9146FF,
      timestamp: DateTime.to_iso8601(DateTime.utc_now()),
      fields: [
        %{name: "Platform", value: to_string(Map.get(data, :platform, "Unknown")), inline: true},
        %{name: "Category", value: Map.get(data, :category, "Just Chatting"), inline: true}
      ],
      thumbnail: %{
        url: data[:thumbnail_url] || @default_avatar_url
      }
    }
  end

  defp build_embed_for_event(_webhook, :stream_end, data) do
    %{
      title: "Stream Ended",
      description: Map.get(data, :title, "The stream has ended"),
      color: 0x808080,
      timestamp: DateTime.to_iso8601(DateTime.utc_now()),
      fields: [
        %{
          name: "Duration",
          value: format_duration(Map.get(data, :duration_seconds, 0)),
          inline: true
        },
        %{name: "Peak Viewers", value: to_string(Map.get(data, :peak_viewers, 0)), inline: true}
      ]
    }
  end

  defp build_embed_for_event(_webhook, :new_follower, data) do
    %{
      title: "New Follower!",
      description: "**#{Map.get(data, :username, "Someone")}** just followed!",
      color: 0xFF69B4,
      timestamp: DateTime.to_iso8601(DateTime.utc_now()),
      thumbnail: %{
        url: data[:avatar_url] || @default_avatar_url
      }
    }
  end

  defp build_embed_for_event(_webhook, :new_subscriber, data) do
    %{
      title: "New Subscriber!",
      description: "**#{Map.get(data, :username, "Someone")}** just subscribed!",
      color: 0xFFD700,
      timestamp: DateTime.to_iso8601(DateTime.utc_now()),
      fields: [
        %{name: "Tier", value: Map.get(data, :tier, "1"), inline: true},
        %{name: "Months", value: to_string(Map.get(data, :months, 1)), inline: true}
      ],
      thumbnail: %{
        url: data[:avatar_url] || @default_avatar_url
      }
    }
  end

  defp build_embed_for_event(_webhook, :raid, data) do
    %{
      title: "Incoming Raid!",
      description:
        "**#{Map.get(data, :raider_name, "Someone")}** is raiding with **#{Map.get(data, :viewer_count, 0)}** viewers!",
      color: 0xFF4500,
      timestamp: DateTime.to_iso8601(DateTime.utc_now()),
      thumbnail: %{
        url: data[:avatar_url] || @default_avatar_url
      }
    }
  end

  defp build_embed_for_event(_webhook, :host, data) do
    %{
      title: "Now Hosting!",
      description: "**#{Map.get(data, :host_name, "Someone")}** is now hosting you!",
      color: 0x00CED1,
      timestamp: DateTime.to_iso8601(DateTime.utc_now()),
      fields: [
        %{name: "Viewers", value: to_string(Map.get(data, :viewer_count, 0)), inline: true}
      ]
    }
  end

  defp build_embed_for_event(_webhook, :poll_created, data) do
    %{
      title: "Poll Created",
      description: Map.get(data, :title, "A new poll has started"),
      color: 0x1E90FF,
      timestamp: DateTime.to_iso8601(DateTime.utc_now()),
      fields: [
        %{
          name: "Duration",
          value: "#{Map.get(data, :duration_seconds, 60)} seconds",
          inline: true
        },
        %{name: "Options", value: format_poll_options(Map.get(data, :options, [])), inline: false}
      ]
    }
  end

  defp build_embed_for_event(_webhook, :poll_ended, data) do
    %{
      title: "Poll Ended",
      description: Map.get(data, :title, "Poll has ended"),
      color: 0x4169E1,
      timestamp: DateTime.to_iso8601(DateTime.utc_now()),
      fields: [
        %{name: "Winner", value: Map.get(data, :winner, "N/A"), inline: true},
        %{name: "Total Votes", value: to_string(Map.get(data, :total_votes, 0)), inline: true}
      ]
    }
  end

  defp build_embed_for_event(_webhook, :giveaway_started, data) do
    %{
      title: "Giveaway Started!",
      description: Map.get(data, :title, "A new giveaway has started!"),
      color: 0x32CD32,
      timestamp: DateTime.to_iso8601(DateTime.utc_now()),
      fields: [
        %{name: "Prize", value: Map.get(data, :prize, "Unknown"), inline: true},
        %{name: "Duration", value: "#{Map.get(data, :duration_minutes, 5)} minutes", inline: true}
      ]
    }
  end

  defp build_embed_for_event(_webhook, :giveaway_ended, data) do
    %{
      title: "Giveaway Winner!",
      description: "**#{Map.get(data, :winner_name, "Someone")}** won the giveaway!",
      color: 0xFFD700,
      timestamp: DateTime.to_iso8601(DateTime.utc_now()),
      fields: [
        %{name: "Prize", value: Map.get(data, :prize, "Unknown"), inline: true},
        %{name: "Entries", value: to_string(Map.get(data, :total_entries, 0)), inline: true}
      ]
    }
  end

  defp build_embed_for_event(_webhook, event_type, data) do
    %{
      title: "Stream Event",
      description: "Event: #{event_type}",
      color: 0x5865F2,
      timestamp: DateTime.to_iso8601(DateTime.utc_now()),
      fields: [
        %{name: "Data", value: data |> Jason.encode!() |> String.slice(0, 1000), inline: false}
      ]
    }
  end

  defp format_event_types(event_types) do
    Enum.map_join(event_types, ", ", &format_event_type/1)
  end

  defp format_event_type(:donation), do: "Donations"
  defp format_event_type(:stream_start), do: "Stream Start"
  defp format_event_type(:stream_end), do: "Stream End"
  defp format_event_type(:new_follower), do: "New Followers"
  defp format_event_type(:new_subscriber), do: "New Subscribers"
  defp format_event_type(:raid), do: "Raids"
  defp format_event_type(:host), do: "Hosts"
  defp format_event_type(:chat_message), do: "Chat Messages"
  defp format_event_type(:poll_created), do: "Poll Created"
  defp format_event_type(:poll_ended), do: "Poll Ended"
  defp format_event_type(:giveaway_started), do: "Giveaway Started"
  defp format_event_type(:giveaway_ended), do: "Giveaway Ended"
  defp format_event_type(other), do: to_string(other)

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

  defp format_poll_options(options) when is_list(options) do
    options
    |> Enum.with_index(1)
    |> Enum.map_join("\n", fn {option, idx} -> "#{idx}. #{option}" end)
  end

  defp format_poll_options(_), do: "No options"
end
