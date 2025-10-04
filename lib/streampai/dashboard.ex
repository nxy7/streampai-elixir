defmodule Streampai.Dashboard do
  @moduledoc """
  Dashboard context for managing user dashboard data and operations.
  """

  alias Streampai.Accounts.User
  alias Streampai.Constants

  @platform_configs [
    %{
      platform: :twitch,
      name: "Twitch",
      connect_name: "Connect Twitch",
      manage_name: "Manage Twitch",
      description: "Link your Twitch account",
      connect_url: "/streaming/connect/twitch",
      icon: "twitch",
      connect_color: "purple",
      manage_color: "green"
    },
    %{
      platform: :youtube,
      name: "YouTube",
      connect_name: "Connect YouTube",
      manage_name: "Manage YouTube",
      description: "Link your YouTube channel",
      connect_url: "/streaming/connect/google",
      icon: "youtube",
      connect_color: "red",
      manage_color: "green"
    }
  ]

  def get_dashboard_data(nil) do
    %{
      user_info: %{
        email: "unknown",
        id: nil,
        display_name: "Guest",
        joined_at: DateTime.utc_now()
      },
      streaming_status: %{status: :offline, connected_platforms: 0},
      usage: %{hours_used: 0, hours_limit: 0},
      quick_actions: [],
      metrics: []
    }
  end

  @doc "Gets dashboard data for a user."
  def get_dashboard_data(%User{} = user) do
    streaming_accounts = get_streaming_accounts(user)

    %{
      user_info: get_user_info(user),
      streaming_status: get_streaming_status(user, streaming_accounts),
      quick_actions: get_quick_actions(user, streaming_accounts),
      usage: get_usage_stats(user, streaming_accounts),
      metrics: get_metrics_cards(user)
    }
  end

  @doc "Gets user information for dashboard display."
  def get_user_info(%User{} = user) do
    %{
      email: user.email,
      id: user.id,
      display_name: get_display_name(user),
      plan: get_user_plan(user),
      joined_at: user.confirmed_at
    }
  end

  @doc "Gets streaming status for a user."
  def get_streaming_status(%User{} = user, streaming_accounts \\ nil) do
    streaming_accounts = streaming_accounts || get_streaming_accounts(user)
    connected_platforms = get_connected_platforms_from_accounts(streaming_accounts)

    %{
      status: :offline,
      connected_platforms: length(connected_platforms),
      active_streams: []
    }
  end

  @doc "Gets usage statistics for a user."
  def get_usage_stats(%User{} = user, streaming_accounts \\ nil) do
    streaming_accounts = streaming_accounts || get_streaming_accounts(user)

    %{
      hours_used: get_hours_used(user),
      hours_limit: get_hours_limit(user),
      platforms_used: get_platforms_used_from_accounts(streaming_accounts),
      platforms_limit: get_platforms_limit(user)
    }
  end

  @doc "Gets quick actions for a user."
  def get_quick_actions(%User{} = user, streaming_accounts \\ nil) do
    streaming_accounts = streaming_accounts || get_streaming_accounts(user)
    connected_platforms = get_connected_platforms_from_accounts(streaming_accounts)

    connected_actions = build_connected_actions(connected_platforms)
    unconnected_actions = build_unconnected_actions(connected_platforms, user)

    connected_actions ++ unconnected_actions
  end

  @doc "Gets platform connections for a user."
  def get_platform_connections(%User{} = user) do
    streaming_accounts = get_streaming_accounts(user)
    connected_platforms = Enum.map(streaming_accounts, & &1.platform)

    Enum.map(@platform_configs, fn config ->
      connected_account = Enum.find(streaming_accounts, &(&1.platform == config.platform))

      %{
        name: config.name,
        platform: config.platform,
        connected: config.platform in connected_platforms,
        connect_url: config.connect_url,
        color: config.connect_color,
        account_data: if(connected_account, do: connected_account.extra_data)
      }
    end)
  end

  @doc "Checks if user has admin privileges."
  def admin?(%User{email: email}) do
    email == Constants.admin_email()
  end

  def admin?(_), do: false

  defp build_connected_actions(connected_platforms) do
    @platform_configs
    |> Enum.filter(fn config -> config.platform in connected_platforms end)
    |> Enum.map(fn config ->
      %{
        name: config.manage_name,
        description: "Connected - Manage settings",
        url: "/dashboard/settings",
        icon: config.icon,
        color: config.manage_color
      }
    end)
  end

  defp build_unconnected_actions(connected_platforms, %User{} = user) do
    connectable = user.tier == :pro or user.connected_platforms == 0

    @platform_configs
    |> Enum.reject(fn config -> config.platform in connected_platforms end)
    |> Enum.map(fn config ->
      %{
        name: config.connect_name,
        description: if(connectable, do: config.description, else: "Upgrade to Pro to connect more accounts"),
        url: if(connectable, do: config.connect_url),
        icon: config.icon,
        color: config.connect_color
      }
    end)
  end

  defp get_streaming_accounts(%User{} = user) do
    case Streampai.Accounts.StreamingAccount.for_user(user.id, actor: user) do
      {:ok, streaming_accounts} -> streaming_accounts
      {:error, _} -> []
    end
  end

  defp get_connected_platforms_from_accounts(streaming_accounts) do
    Enum.map(streaming_accounts, & &1.platform)
  end

  defp get_display_name(%User{email: email}) when is_binary(email) do
    email
    |> String.split("@")
    |> List.first()
    |> String.capitalize()
  end

  defp get_display_name(_), do: "User"

  defp get_user_plan(%User{tier: :pro}), do: :paid
  defp get_user_plan(%User{}), do: :free

  defp get_hours_used(%User{} = user) do
    # Load the calculation if it's not already loaded
    case Map.get(user, :hours_streamed_last_30_days) do
      %Ash.NotLoaded{} ->
        user
        |> Ash.load!(:hours_streamed_last_30_days, authorize?: false)
        |> Map.get(:hours_streamed_last_30_days)

      hours when is_float(hours) ->
        hours

      _ ->
        0.0
    end
  end

  defp get_hours_limit(%User{tier: :pro}), do: :unlimited
  defp get_hours_limit(_), do: Constants.free_tier_hour_limit()

  defp get_platforms_used_from_accounts(streaming_accounts) do
    length(streaming_accounts)
  end

  defp get_platforms_limit(%User{tier: :pro}), do: 99
  defp get_platforms_limit(_plan), do: 1

  @doc "Gets metrics cards for dashboard display with real data."
  def get_metrics_cards(%User{} = user) do
    current_month_stats = calculate_month_stats(user, 0)
    previous_month_stats = calculate_month_stats(user, 1)

    [
      %{
        title: "Live Streams",
        value: current_month_stats.stream_count,
        change:
          calculate_percentage_change(
            current_month_stats.stream_count,
            previous_month_stats.stream_count
          ),
        change_type: get_change_type(current_month_stats.stream_count, previous_month_stats.stream_count),
        icon: "play",
        description: "Streams completed this month"
      },
      %{
        title: "Average Viewers",
        value: current_month_stats.avg_viewers,
        change:
          calculate_percentage_change(
            current_month_stats.avg_viewers,
            previous_month_stats.avg_viewers
          ),
        change_type: get_change_type(current_month_stats.avg_viewers, previous_month_stats.avg_viewers),
        icon: "eye",
        description: "Per stream this month"
      },
      %{
        title: "Chat Messages",
        value: format_large_number(current_month_stats.total_messages),
        change:
          calculate_percentage_change(
            current_month_stats.total_messages,
            previous_month_stats.total_messages
          ),
        change_type: get_change_type(current_month_stats.total_messages, previous_month_stats.total_messages),
        icon: "chat-bubble-left",
        description: "Messages received across all streams"
      },
      %{
        title: "Streaming Hours",
        value: format_duration_hours_minutes(current_month_stats.streaming_seconds),
        change:
          calculate_percentage_change(
            current_month_stats.streaming_seconds,
            previous_month_stats.streaming_seconds
          ),
        change_type:
          get_change_type(
            current_month_stats.streaming_seconds,
            previous_month_stats.streaming_seconds
          ),
        icon: "clock",
        description: "Total time streamed this month"
      }
    ]
  end

  defp calculate_month_stats(user, months_ago) do
    alias Streampai.Stream.Livestream

    require Ash.Query

    # Calculate 30-day rolling periods
    # months_ago = 0: last 30 days (0-30 days ago)
    # months_ago = 1: previous 30 days (30-60 days ago)
    now = DateTime.utc_now()
    period_end = DateTime.add(now, -(months_ago * 30 * 24 * 60 * 60), :second)
    period_start = DateTime.add(period_end, -(30 * 24 * 60 * 60), :second)

    streams =
      Livestream
      |> Ash.Query.for_read(:get_completed_by_user, %{user_id: user.id})
      |> Ash.Query.filter(started_at >= ^period_start and started_at <= ^period_end)
      |> Ash.Query.load([
        :average_viewers,
        :messages_amount,
        :duration_seconds
      ])
      |> Ash.read!(authorize?: false)

    stream_count = length(streams)

    avg_viewers =
      if stream_count > 0 do
        total_avg = Enum.sum(Enum.map(streams, &(&1.average_viewers || 0)))
        round(total_avg / stream_count)
      else
        0
      end

    total_messages = Enum.sum(Enum.map(streams, &(&1.messages_amount || 0)))

    streaming_seconds =
      streams
      |> Enum.map(&(&1.duration_seconds || 0))
      |> Enum.sum()

    %{
      stream_count: stream_count,
      avg_viewers: avg_viewers,
      total_messages: total_messages,
      streaming_seconds: streaming_seconds
    }
  end

  defp calculate_percentage_change(_current, 0), do: "—"
  defp calculate_percentage_change(0, _previous), do: "-100%"

  defp calculate_percentage_change(current, previous) do
    change = round((current - previous) / previous * 100)
    sign = if change >= 0, do: "+", else: ""
    "#{sign}#{change}%"
  end

  defp get_change_type(current, previous) when current > previous, do: :positive
  defp get_change_type(current, previous) when current < previous, do: :negative
  defp get_change_type(_current, _previous), do: :neutral

  defp format_duration_hours_minutes(seconds) do
    StreampaiWeb.Utils.DateTimeUtils.format_duration(seconds)
  end

  defp format_large_number(num) when num >= 1000 do
    "#{Float.round(num / 1000, 1)}K"
  end

  defp format_large_number(num), do: to_string(num)
end
