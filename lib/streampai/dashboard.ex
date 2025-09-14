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
    # Load streaming accounts once to avoid multiple queries
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

  defp get_hours_used(%User{}), do: 0.0

  defp get_hours_limit(%User{tier: :pro}), do: :unlimited
  defp get_hours_limit(_), do: Constants.free_tier_hour_limit()

  defp get_platforms_used_from_accounts(streaming_accounts) do
    length(streaming_accounts)
  end

  defp get_platforms_limit(%User{tier: :pro}), do: 99
  defp get_platforms_limit(_plan), do: 1

  @doc "Gets metrics cards for dashboard display with mock data."
  def get_metrics_cards(%User{} = user) do
    current_month = Date.beginning_of_month(Date.utc_today())

    # Generate consistent mock data based on user ID for demonstration
    seed = :erlang.phash2(user.id, 1000)
    rand_state = :rand.seed_s(:exsss, {seed, seed + 1, seed + 2})

    [
      %{
        title: "Donations This Month",
        value: format_currency(generate_donation_amount(rand_state)),
        change: generate_percentage_change(rand_state),
        change_type: :positive,
        icon: "currency-dollar",
        description: "Total donations received in #{current_month |> Date.to_string() |> String.slice(0, 7)}"
      },
      %{
        title: "New Subscribers",
        value: generate_count(5, 150, rand_state),
        change: generate_percentage_change(rand_state),
        change_type: :positive,
        icon: "users",
        description: "Gained this month across all platforms"
      },
      %{
        title: "Live Streams",
        value: generate_count(3, 25, rand_state),
        change: generate_percentage_change(rand_state),
        change_type: if(elem(:rand.uniform_s(rand_state), 0) > 0.7, do: :negative, else: :positive),
        icon: "play",
        description: "Streams completed this month"
      },
      %{
        title: "Average Viewers",
        value: generate_count(12, 500, rand_state),
        change: generate_percentage_change(rand_state),
        change_type: if(elem(:rand.uniform_s(rand_state), 0) > 0.6, do: :negative, else: :positive),
        icon: "eye",
        description: "Per stream this month"
      },
      %{
        title: "Streaming Hours",
        value: "#{generate_count(5, 80, rand_state)}h",
        change: generate_percentage_change(rand_state),
        change_type: :positive,
        icon: "clock",
        description: "Total time streamed this month"
      },
      %{
        title: "Chat Messages",
        value: format_large_number(generate_count(500, 15_000, rand_state)),
        change: generate_percentage_change(rand_state),
        change_type: :positive,
        icon: "chat-bubble-left",
        description: "Messages received across all streams"
      },
      %{
        title: "Patreon Supporters",
        value: generate_count(8, 200, rand_state),
        change: generate_percentage_change(rand_state),
        change_type: if(elem(:rand.uniform_s(rand_state), 0) > 0.8, do: :negative, else: :positive),
        icon: "heart",
        description: "Active monthly supporters"
      },
      %{
        title: "Revenue Goal",
        value: "#{elem(:rand.uniform_s(40, rand_state), 0) + 45}%",
        change: "+#{elem(:rand.uniform_s(15, rand_state), 0) + 5}%",
        change_type: :positive,
        icon: "chart-bar",
        description: "Progress towards monthly goal"
      }
    ]
  end

  # Helper functions for generating mock data
  defp generate_donation_amount(rand_state) do
    {base_amount, rand_state} = :rand.uniform_s(1500, rand_state)
    {variation, _rand_state} = :rand.uniform_s(500, rand_state)
    amount = base_amount + 200 + (variation - 250)
    Float.round(amount / 1, 2)
  end

  defp generate_count(min, max, rand_state) do
    {value, _rand_state} = :rand.uniform_s(max - min, rand_state)
    value + min
  end

  defp generate_percentage_change(rand_state) do
    {change, rand_state} = :rand.uniform_s(30, rand_state)
    {sign_rand, _rand_state} = :rand.uniform_s(rand_state)
    sign = if sign_rand > 0.3, do: "+", else: "-"
    "#{sign}#{change + 1}%"
  end

  defp format_currency(amount) do
    "$#{:erlang.float_to_binary(amount, decimals: 2)}"
  end

  defp format_large_number(num) when num >= 1000 do
    "#{Float.round(num / 1000, 1)}K"
  end

  defp format_large_number(num), do: to_string(num)
end
