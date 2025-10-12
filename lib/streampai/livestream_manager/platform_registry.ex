defmodule Streampai.LivestreamManager.PlatformRegistry do
  @moduledoc """
  Registry for mapping platform atoms to their manager modules.

  Provides a centralized way to get the appropriate manager module
  for a given platform without needing to know the specific module names.
  """

  @platform_managers %{
    twitch: Streampai.LivestreamManager.Platforms.TwitchManager,
    youtube: Streampai.LivestreamManager.Platforms.YouTubeManager,
    kick: Streampai.LivestreamManager.Platforms.KickManager,
    facebook: Streampai.LivestreamManager.Platforms.FacebookManager,
    tiktok: Streampai.LivestreamManager.Platforms.TiktokManager,
    trovo: Streampai.LivestreamManager.Platforms.TrovoManager,
    instagram: Streampai.LivestreamManager.Platforms.InstagramManager,
    rumble: Streampai.LivestreamManager.Platforms.RumbleManager
  }

  @doc """
  Get the manager module for a platform.

  ## Parameters
  - `platform`: Platform atom (:twitch, :youtube, :kick, etc.)

  ## Returns
  - `{:ok, manager_module}` - Found the manager
  - `{:error, :unknown_platform}` - Platform not registered

  ## Example
      {:ok, TwitchManager} = PlatformRegistry.get_manager(:twitch)
  """
  def get_manager(platform) when is_atom(platform) do
    case Map.get(@platform_managers, platform) do
      nil -> {:error, :unknown_platform}
      manager -> {:ok, manager}
    end
  end

  @doc """
  Get all registered platforms.

  ## Returns
  List of platform atoms

  ## Example
      [:twitch, :youtube, :kick, ...] = PlatformRegistry.platforms()
  """
  def platforms do
    Map.keys(@platform_managers)
  end

  @doc """
  Check if a platform is registered.

  ## Parameters
  - `platform`: Platform atom

  ## Returns
  Boolean

  ## Example
      true = PlatformRegistry.platform_registered?(:twitch)
      false = PlatformRegistry.platform_registered?(:unknown)
  """
  def platform_registered?(platform) when is_atom(platform) do
    Map.has_key?(@platform_managers, platform)
  end
end
