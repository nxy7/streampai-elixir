defmodule Streampai.Accounts.UserHelpers do
  @moduledoc """
  Helper functions for working with User data, including fallback username and avatar extraction.
  """

  @doc """
  Gets fallback username from extra_data platform information.

  Returns the platform username if the user hasn't set a custom name yet.
  """
  def get_fallback_username(%{extra_data: extra_data, name: name}) when not is_nil(extra_data) do
    case name do
      nil -> extract_platform_name(extra_data)
      "" -> extract_platform_name(extra_data)
      _ -> name
    end
  end

  def get_fallback_username(%{name: name}), do: name

  @doc """
  Gets fallback avatar URL from extra_data platform information.

  Returns the platform avatar/picture if available.
  """
  def get_fallback_avatar(%{extra_data: extra_data}) when not is_nil(extra_data) do
    extract_platform_avatar(extra_data)
  end

  def get_fallback_avatar(_user), do: nil

  @doc """
  Gets platform information from extra_data.

  Returns a map with platform and profile information.
  """
  def get_platform_info(%{extra_data: extra_data}) when not is_nil(extra_data) do
    %{
      platform: extra_data["platform"],
      user_info: extra_data
    }
  end

  def get_platform_info(_user), do: %{platform: nil, user_info: nil}

  # Private helper functions

  defp extract_platform_name(%{"platform" => "google"} = data) do
    data["name"] || data["given_name"]
  end

  defp extract_platform_name(%{"platform" => "twitch"} = data) do
    data["display_name"] || data["login"]
  end

  defp extract_platform_name(_), do: nil

  defp extract_platform_avatar(%{"platform" => "google"} = data) do
    data["picture"]
  end

  defp extract_platform_avatar(%{"platform" => "twitch"} = data) do
    data["profile_image_url"]
  end

  defp extract_platform_avatar(_), do: nil
end
