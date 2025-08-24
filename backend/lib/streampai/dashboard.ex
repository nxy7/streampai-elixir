defmodule Streampai.Dashboard do
  @moduledoc """
  Dashboard context for managing user dashboard data and operations.

  This context handles dashboard-specific business logic, including:
  - User statistics and metrics
  - Platform connection status
  - Usage tracking and limits
  - Dashboard configuration
  """

  alias Streampai.Accounts.User
  alias Streampai.Constants

  def get_dashboard_data(nil) do
    %{
      user_info: %{email: "unknown", id: nil, display_name: "Guest"},
      streaming_status: %{status: :offline, connected_platforms: 0},
      usage: %{hours_used: 0, hours_limit: 0},
      quick_actions: []
    }
  end

  @doc """
  Gets dashboard data for a user.

  ## Examples

      iex> get_dashboard_data(user)
      %{
        user_info: %{email: "user@example.com", ...},
        streaming_status: %{status: :offline, ...},
        quick_actions: [...]
      }
  """
  def get_dashboard_data(%User{} = user) do
    %{
      user_info: get_user_info(user),
      streaming_status: get_streaming_status(user),
      quick_actions: get_quick_actions(user),
      usage: get_usage_stats(user)
    }
  end

  @doc """
  Gets user information for dashboard display.
  """
  def get_user_info(%User{} = user) do
    %{
      email: user.email,
      id: user.id,
      display_name: get_display_name(user),
      plan: get_user_plan(user),
      joined_at: user.confirmed_at
    }
  end

  @doc """
  Gets current streaming status for a user.
  """
  def get_streaming_status(%User{} = _user) do
    %{
      status: :offline,
      connected_platforms: 0,
      active_streams: []
    }
  end

  @doc """
  Gets usage statistics for a user.
  """
  def get_usage_stats(%User{} = user) do
    plan = get_user_plan(user)

    %{
      hours_used: get_hours_used(user),
      hours_limit: get_hours_limit(plan),
      platforms_used: get_platforms_used(user),
      platforms_limit: get_platforms_limit(plan)
    }
  end

  @doc """
  Gets quick actions available to the user.
  """
  def get_quick_actions(%User{} = _user) do
    [
      %{
        name: "Connect Twitch",
        description: "Link your Twitch account",
        url: "/streaming/connect/twitch",
        icon: "twitch",
        color: "purple"
      },
      %{
        name: "Connect YouTube",
        description: "Link your YouTube channel",
        url: "/streaming/connect/google",
        icon: "youtube",
        color: "red"
      }
    ]
  end

  @doc """
  Gets platform connections for a user.
  """
  def get_platform_connections(%User{} = _user) do
    # TODO: Implement real platform connection logic
    [
      %{
        name: "Twitch",
        connected: false,
        connect_url: "/streaming/connect/twitch",
        color: "purple"
      },
      %{name: "YouTube", connected: false, connect_url: "/streaming/connect/google", color: "red"}
    ]
  end

  @doc """
  Checks if user has admin privileges.
  """
  def admin?(%User{email: "lolnoxy@gmail.com"}), do: true
  def admin?(_), do: false

  # Private functions

  defp get_display_name(%User{email: email}) when is_binary(email) do
    email
    |> String.split("@")
    |> hd()
    |> String.capitalize()
  end

  defp get_display_name(_), do: "User"

  defp get_user_plan(%User{} = _user) do
    # TODO: Implement real plan detection
    :free
  end

  defp get_hours_used(%User{} = _user) do
    # TODO: Implement real usage tracking
    0.0
  end

  defp get_hours_limit(:free), do: Constants.free_tier_hour_limit()
  defp get_hours_limit(_), do: Constants.free_tier_hour_limit()

  defp get_platforms_used(%User{} = _user) do
    # TODO: Implement real platform counting
    0
  end

  defp get_platforms_limit(:free), do: 1
  defp get_platforms_limit(_), do: 1
end
