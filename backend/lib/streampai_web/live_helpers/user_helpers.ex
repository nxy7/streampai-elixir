defmodule StreampaiWeb.LiveHelpers.UserHelpers do
  @moduledoc """
  Helper functions for user-related logic across LiveViews.
  """

  @doc """
  Gets a display name from user data with fallback.
  """
  def get_display_name(%{dashboard_data: %{user_info: %{display_name: name}}}) when is_binary(name) and name != "",
    do: name

  def get_display_name(%{current_user: %{name: name}}) when is_binary(name) and name != "", do: name

  def get_display_name(_), do: "User"

  @doc """
  Gets the current plan string from user tier.
  """
  def get_current_plan(%{tier: :pro}), do: "pro"
  def get_current_plan(_), do: "free"

  @doc """
  Gets tier display text for UI.
  """
  def get_tier_display(:pro), do: "Pro (Unlimited hours/month)"
  def get_tier_display(_), do: "Free (#{Streampai.Constants.free_tier_hour_limit()} hours/month)"

  @doc """
  Gets hours limit display for UI.
  """
  def get_hours_limit(:pro, _usage), do: "∞"
  def get_hours_limit(_, usage), do: Map.get(usage, :hours_limit, 0)

  @doc """
  Gets welcome message based on join date.
  """
  def get_welcome_message(display_name, joined_date) do
    today = Date.utc_today()
    same_day = Date.compare(joined_date, today) == :eq

    if same_day do
      "Welcome, #{display_name}! Great to have you here :-)"
    else
      "Welcome back, #{display_name}!"
    end
  end

  @doc """
  Gets joined date from user info with fallback.
  """
  def get_joined_date(%{user_info: %{joined_at: joined_at}}) when not is_nil(joined_at) do
    DateTime.to_date(joined_at)
  end

  def get_joined_date(_), do: Date.utc_today()

  @doc """
  Checks if an error is a duplicate email error.
  """
  def duplicate_email_error?(changeset) do
    Enum.any?(changeset.errors, &duplicate_error?/1)
  end

  defp duplicate_error?(%{field: :email, message: message}) when is_binary(message) do
    message_lower = String.downcase(message)

    duplicate_keywords = [
      "has already been taken",
      "already been taken",
      "already exists",
      "unique",
      "constraint",
      "duplicate"
    ]

    Enum.any?(duplicate_keywords, &String.contains?(message_lower, &1))
  end

  defp duplicate_error?(_), do: false

  @doc """
  Extracts error message from changeset.
  """
  def extract_error_message(%{errors: [%{field: :email, message: message} | _]}), do: message
  def extract_error_message(_), do: "Please enter a valid email address."
end
