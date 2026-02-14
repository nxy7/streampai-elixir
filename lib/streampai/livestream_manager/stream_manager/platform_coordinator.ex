defmodule Streampai.LivestreamManager.StreamManager.PlatformCoordinator do
  @moduledoc """
  Coordinates starting and stopping streaming on external platforms
  (Twitch, YouTube, Facebook, Kick).

  Manages platform manager processes and runs platform operations in parallel.
  """

  alias Streampai.Accounts.User
  alias Streampai.LivestreamManager.Platforms.FacebookManager
  alias Streampai.LivestreamManager.Platforms.KickManager
  alias Streampai.LivestreamManager.Platforms.TwitchManager
  alias Streampai.LivestreamManager.Platforms.YouTubeManager
  alias Streampai.LivestreamManager.RegistryHelpers
  alias Streampai.LivestreamManager.StreamServices

  require Logger

  @platform_manager_startup_delay 100

  @doc """
  Starts streaming on selected platforms in parallel.

  Returns `{succeeded, failed}` where:
  - `succeeded` is a list of `{platform, :ok}` tuples
  - `failed` is a list of `{platform, {:error, reason}}` tuples
  """
  @spec start_streaming(String.t(), String.t(), map(), list() | nil) ::
          {list({atom(), :ok}), list({atom(), {:error, term()}})}
  def start_streaming(user_id, livestream_id, metadata, selected_platforms \\ nil) do
    active_platforms =
      case selected_platforms do
        nil -> get_active_platforms(user_id)
        platforms when is_list(platforms) -> platforms
      end

    Logger.info("Starting streaming on platforms: #{inspect(active_platforms)}")

    tasks =
      Enum.map(active_platforms, fn platform ->
        Task.async(fn ->
          try do
            ensure_platform_manager_started(user_id, platform)

            case start_platform(platform, user_id, livestream_id, metadata) do
              :ok -> {platform, :ok}
              {:ok, _} -> {platform, :ok}
              {:error, reason} -> {platform, {:error, reason}}
              _ -> {platform, :ok}
            end
          rescue
            error ->
              Logger.error("Failed to start platform #{platform}: #{inspect(error)}")
              {platform, {:error, error}}
          catch
            kind, value ->
              Logger.error("Caught #{kind} while starting platform #{platform}: #{inspect(value)}")

              {platform, {:error, {kind, value}}}
          end
        end)
      end)

    results = Task.await_many(tasks, 30_000)

    Enum.each(results, fn {platform, result} ->
      Logger.info("Platform #{platform} start: #{inspect(result)}")
    end)

    {succeeded, failed} =
      Enum.split_with(results, fn {_platform, result} -> result == :ok end)

    {succeeded, failed}
  end

  def stop_streaming(user_id) do
    active_platforms = get_active_platforms(user_id)
    Logger.info("Stopping streaming on platforms: #{inspect(active_platforms)}")

    tasks =
      Enum.map(active_platforms, fn platform ->
        Task.async(fn ->
          try do
            case stop_platform(platform, user_id) do
              :ok -> {platform, :ok}
              {:error, reason} -> {platform, {:error, reason}}
              _ -> {platform, :ok}
            end
          rescue
            error ->
              Logger.error("Failed to stop platform #{platform}: #{inspect(error)}")
              {platform, {:error, error}}
          catch
            kind, value ->
              Logger.error("Caught #{kind} while stopping platform #{platform}: #{inspect(value)}")

              {platform, {:error, {kind, value}}}
          end
        end)
      end)

    results = Task.await_many(tasks, 30_000)

    Enum.each(results, fn {platform, result} ->
      Logger.info("Platform #{platform} stop: #{inspect(result)}")
    end)
  end

  def stop_single_platform(user_id, platform) when is_binary(user_id) and is_atom(platform) do
    Logger.info("Stopping single platform: #{platform}")

    try do
      stop_platform(platform, user_id)
      {platform, :ok}
    rescue
      error ->
        Logger.error("Failed to stop platform #{platform}: #{inspect(error)}")
        {platform, {:error, error}}
    end
  end

  def get_active_platforms(user_id) do
    case load_user_with_streaming_accounts(user_id) do
      {:ok, user} ->
        Enum.map(user.streaming_accounts, & &1.platform)

      {:error, reason} ->
        Logger.warning("Could not load user or streaming accounts: #{inspect(reason)}")
        []
    end
  rescue
    e ->
      Logger.error("Exception loading user platforms: #{inspect(e)}")
      []
  end

  @doc """
  Reattaches platform managers to a running stream after app restart.

  For each platform that has stored reconnection data (status "live" in its column),
  starts the platform manager and calls `reattach_streaming` instead of `start_streaming`.
  This avoids creating duplicate Cloudflare outputs or YouTube broadcasts.
  """
  @spec reattach_platforms(String.t(), String.t(), map()) :: :ok
  def reattach_platforms(user_id, livestream_id, platform_data) do
    platform_modules = %{
      twitch: TwitchManager,
      youtube: YouTubeManager,
      kick: KickManager
    }

    tasks =
      Enum.flat_map(platform_modules, fn {platform, module} ->
        data = Map.get(platform_data, platform, %{})

        if data["status"] == "live" do
          [
            Task.async(fn ->
              try do
                ensure_platform_manager_started(user_id, platform)

                case module.reattach_streaming(user_id, livestream_id, data) do
                  :ok ->
                    Logger.info("Reattached platform #{platform} for user #{user_id}")
                    {platform, :ok}

                  {:ok, _} ->
                    Logger.info("Reattached platform #{platform} for user #{user_id}")
                    {platform, :ok}

                  {:error, reason} ->
                    Logger.error("Failed to reattach #{platform}: #{inspect(reason)}")
                    {platform, {:error, reason}}

                  _ ->
                    Logger.info("Reattached platform #{platform} for user #{user_id}")
                    {platform, :ok}
                end
              rescue
                error ->
                  Logger.error("Failed to reattach #{platform}: #{inspect(error)}")
                  {platform, {:error, error}}
              catch
                kind, value ->
                  Logger.error("Caught #{kind} reattaching #{platform}: #{inspect(value)}")
                  {platform, {:error, {kind, value}}}
              end
            end)
          ]
        else
          []
        end
      end)

    if tasks != [] do
      results = Task.await_many(tasks, 30_000)

      Enum.each(results, fn {platform, result} ->
        Logger.info("Platform #{platform} reattach: #{inspect(result)}")
      end)
    end

    :ok
  end

  # -- Private --

  defp start_platform(:twitch, user_id, livestream_id, metadata),
    do: TwitchManager.start_streaming(user_id, livestream_id, metadata)

  defp start_platform(:youtube, user_id, livestream_id, metadata),
    do: YouTubeManager.start_streaming(user_id, livestream_id, metadata)

  defp start_platform(:facebook, user_id, livestream_id, _metadata),
    do: FacebookManager.start_streaming(user_id, livestream_id)

  defp start_platform(:kick, user_id, livestream_id, _metadata), do: KickManager.start_streaming(user_id, livestream_id)

  defp start_platform(platform, _user_id, _livestream_id, _metadata), do: Logger.warning("Unknown platform: #{platform}")

  defp stop_platform(:twitch, user_id), do: TwitchManager.stop_streaming(user_id)
  defp stop_platform(:youtube, user_id), do: YouTubeManager.stop_streaming(user_id)
  defp stop_platform(:facebook, user_id), do: FacebookManager.stop_streaming(user_id)
  defp stop_platform(:kick, user_id), do: KickManager.stop_streaming(user_id)
  defp stop_platform(platform, _user_id), do: Logger.warning("Unknown platform: #{platform}")

  defp ensure_platform_manager_started(user_id, platform) do
    case RegistryHelpers.lookup(:platform_manager, user_id, platform) do
      {:ok, _pid} -> :ok
      :error -> start_new_platform_manager(user_id, platform)
    end
  end

  defp start_new_platform_manager(user_id, platform) do
    case get_platform_config(user_id, platform) do
      {:ok, config} ->
        StreamServices.start_platform_manager(user_id, platform, config)
        Process.sleep(@platform_manager_startup_delay)

      {:error, reason} ->
        Logger.warning("Could not get config for #{platform}: #{inspect(reason)}")
    end
  end

  defp get_platform_config(user_id, platform) do
    with {:ok, user} <- load_user_with_streaming_accounts(user_id),
         %{} = account <- Enum.find(user.streaming_accounts, &(&1.platform == platform)) do
      {:ok,
       %{
         access_token: account.access_token,
         refresh_token: account.refresh_token,
         expires_at: account.access_token_expires_at,
         extra_data: account.extra_data
       }}
    else
      nil -> {:error, :platform_not_found}
      {:error, reason} -> {:error, reason}
    end
  rescue
    e ->
      Logger.error("Exception getting platform config: #{inspect(e)}")
      {:error, e}
  end

  defp load_user_with_streaming_accounts(user_id) do
    Ash.get(User, user_id, actor: Streampai.SystemActor.system(), load: [:streaming_accounts])
  end
end
