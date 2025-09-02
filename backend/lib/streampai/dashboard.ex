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
      user_info: %{email: "unknown", id: nil, display_name: "Guest"},
      streaming_status: %{status: :offline, connected_platforms: 0},
      usage: %{hours_used: 0, hours_limit: 0},
      quick_actions: []
    }
  end

  @doc "Gets dashboard data for a user."
  def get_dashboard_data(%User{} = user) do
    %{
      user_info: get_user_info(user),
      streaming_status: get_streaming_status(user),
      quick_actions: get_quick_actions(user),
      usage: get_usage_stats(user)
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
  def get_streaming_status(%User{} = user) do
    connected_platforms = get_connected_platforms(user)

    %{
      status: :offline,
      connected_platforms: length(connected_platforms),
      active_streams: []
    }
  end

  @doc "Gets usage statistics for a user."
  def get_usage_stats(%User{} = user) do
    %{
      hours_used: get_hours_used(user),
      hours_limit: get_hours_limit(user),
      platforms_used: get_platforms_used(user),
      platforms_limit: get_platforms_limit(user)
    }
  end

  @doc "Gets quick actions for a user."
  def get_quick_actions(%User{} = user) do
    connected_platforms = get_connected_platforms(user)

    connected_actions = build_connected_actions(connected_platforms)
    unconnected_actions = build_unconnected_actions(connected_platforms, user)

    connected_actions ++ unconnected_actions
  end

  @doc "Gets platform connections for a user."
  def get_platform_connections(%User{} = user) do
    connected_platforms = get_connected_platforms(user)

    Enum.map(@platform_configs, fn config ->
      %{
        name: config.name,
        platform: config.platform,
        connected: config.platform in connected_platforms,
        connect_url: config.connect_url,
        color: config.connect_color
      }
    end)
  end

  @doc "Checks if user has admin privileges."
  def admin?(%User{email: "lolnoxy@gmail.com"}), do: true
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
        description:
          if(connectable, do: config.description, else: "Upgrade to Pro to connect more accounts"),
        url: if(connectable, do: config.connect_url, else: nil),
        icon: config.icon,
        color: config.connect_color
      }
    end)
  end

  defp get_connected_platforms(%User{} = user) do
    query =
      Streampai.Accounts.StreamingAccount
      |> Ash.Query.for_read(:for_user, %{user_id: user.id}, actor: user)

    {:ok, streaming_accounts} = Ash.read(query)
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

  defp get_platforms_used(%User{} = user) do
    user
    |> get_connected_platforms()
    |> length()
  end

  defp get_platforms_limit(%User{tier: :pro}), do: 99
  defp get_platforms_limit(_plan), do: 1
end
