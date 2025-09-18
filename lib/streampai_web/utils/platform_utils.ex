defmodule StreampaiWeb.Utils.PlatformUtils do
  @moduledoc """
  Utilities for handling streaming platform-specific styling and information.
  """

  @doc """
  Returns the list of all supported streaming platforms.
  """
  def supported_platforms do
    Streampai.Stream.Platform.values()
  end

  @doc """
  Returns the background color class for a given platform.
  """
  def platform_color(:twitch), do: "bg-purple-500"
  def platform_color("Twitch"), do: "bg-purple-500"
  def platform_color(:youtube), do: "bg-red-500"
  def platform_color("YouTube"), do: "bg-red-500"
  def platform_color(:facebook), do: "bg-blue-600"
  def platform_color("Facebook"), do: "bg-blue-600"
  def platform_color(:kick), do: "bg-green-500"
  def platform_color("Kick"), do: "bg-green-500"
  def platform_color("Streampai"), do: "bg-purple-500"
  def platform_color(_), do: "bg-gray-500"

  @doc """
  Returns the initial letter for a given platform.
  """
  def platform_initial(:twitch), do: "T"
  def platform_initial(:youtube), do: "Y"
  def platform_initial(:facebook), do: "F"
  def platform_initial(:kick), do: "K"
  def platform_initial(_), do: "?"

  @doc """
  Returns the display name for a given platform.
  """
  def platform_name(:twitch), do: "Twitch"
  def platform_name(:youtube), do: "YouTube"
  def platform_name(:facebook), do: "Facebook"
  def platform_name(:kick), do: "Kick"

  def platform_name(platform) when is_atom(platform), do: platform |> to_string() |> String.capitalize()

  def platform_name(platform) when is_binary(platform), do: String.capitalize(platform)

  @doc """
  Returns the badge color classes for a given platform.
  """
  def platform_badge_color(:twitch), do: "bg-purple-100 text-purple-800"
  def platform_badge_color("Twitch"), do: "bg-purple-100 text-purple-800"
  def platform_badge_color(:youtube), do: "bg-red-100 text-red-800"
  def platform_badge_color("YouTube"), do: "bg-red-100 text-red-800"
  def platform_badge_color(:facebook), do: "bg-blue-100 text-blue-800"
  def platform_badge_color("Facebook"), do: "bg-blue-100 text-blue-800"
  def platform_badge_color(:kick), do: "bg-green-100 text-green-800"
  def platform_badge_color("Kick"), do: "bg-green-100 text-green-800"
  def platform_badge_color("Streampai"), do: "bg-pink-100 text-pink-800"
  def platform_badge_color(_), do: "bg-gray-100 text-gray-800"

  @doc """
  Returns the solid background color class for a given platform (darker shade for progress bars, etc.).
  """
  def platform_solid_color(:twitch), do: "bg-purple-600"
  def platform_solid_color("Twitch"), do: "bg-purple-600"
  def platform_solid_color(:youtube), do: "bg-red-600"
  def platform_solid_color("YouTube"), do: "bg-red-600"
  def platform_solid_color(:facebook), do: "bg-blue-600"
  def platform_solid_color("Facebook"), do: "bg-blue-600"
  def platform_solid_color(:kick), do: "bg-green-600"
  def platform_solid_color("Kick"), do: "bg-green-600"
  def platform_solid_color("Streampai"), do: "bg-gradient-to-r from-purple-600 to-pink-600"
  def platform_solid_color(_), do: "bg-gray-600"

  @doc """
  Formats time ago for display in a human-readable format.
  """
  def format_time_ago(minutes) when minutes < 1, do: "just now"
  def format_time_ago(minutes) when minutes < 60, do: "#{trunc(minutes)} minutes ago"
  def format_time_ago(minutes), do: "#{trunc(minutes / 60)} hours ago"
end
