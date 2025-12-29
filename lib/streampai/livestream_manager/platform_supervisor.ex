defmodule Streampai.LivestreamManager.PlatformSupervisor do
  @moduledoc """
  Dynamic supervisor for platform-specific managers (Twitch, YouTube, etc.).
  Automatically starts managers for user's connected platforms.
  """
  use DynamicSupervisor

  alias Streampai.Accounts.StreamingAccount
  alias Streampai.LivestreamManager.Platforms

  @initialization_delay 100

  def start_link(user_id) when is_binary(user_id) do
    DynamicSupervisor.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  @impl true
  def init(user_id) do
    # Start platform managers for user's connected platforms
    spawn(fn -> initialize_user_platforms(user_id) end)

    DynamicSupervisor.init(strategy: :one_for_one)
  end

  # Client API

  @doc """
  Starts a platform manager for a specific platform.
  """
  def start_platform_manager(user_id, platform, config)
      when platform in ~w(twitch youtube facebook kick tiktok trovo instagram rumble)a do
    supervisor_pid = via_tuple(user_id)

    child_spec = get_platform_manager_spec(user_id, platform, config)

    case DynamicSupervisor.start_child(supervisor_pid, child_spec) do
      {:ok, pid} -> {:ok, pid}
      {:error, {:already_started, pid}} -> {:ok, pid}
      error -> error
    end
  end

  @doc """
  Stops a platform manager.
  """
  def stop_platform_manager(user_id, platform) do
    case Registry.lookup(
           Streampai.LivestreamManager.Registry,
           {:platform_manager, user_id, platform}
         ) do
      [{pid, _}] ->
        supervisor_pid = via_tuple(user_id)
        DynamicSupervisor.terminate_child(supervisor_pid, pid)

      [] ->
        {:error, :not_found}
    end
  end

  @doc """
  Broadcasts a chat message to specified platforms or all platforms.
  """
  def broadcast_message(user_id, message, platforms \\ :all) do
    execute_on_platforms(user_id, platforms, fn platform_module, _pid ->
      platform_module.send_chat_message(user_id, message)
    end)
  end

  @doc """
  Updates stream metadata on specified platforms.
  """
  def update_metadata(user_id, metadata, platforms \\ :all) do
    execute_on_platforms(user_id, platforms, fn platform_module, _pid ->
      platform_module.update_stream_metadata(user_id, metadata)
    end)
  end

  @doc """
  Bans a user from the chat on a specific platform.

  ## Parameters
  - `user_id` - The user ID who owns the stream
  - `platform` - The platform to ban the user on (:twitch, :youtube, etc.)
  - `target_user_id` - Platform-specific identifier of the user to ban
  - `reason` - Optional reason for the ban

  ## Returns
  - `{:ok, ban_id}` - User banned successfully
  - `{:error, reason}` - Failed to ban user
  """
  def ban_user(user_id, platform, target_user_id, reason \\ nil) do
    execute_on_single_platform(user_id, platform, fn platform_module ->
      platform_module.ban_user(user_id, target_user_id, reason)
    end)
  end

  @doc """
  Times out a user from the chat on a specific platform.

  ## Parameters
  - `user_id` - The user ID who owns the stream
  - `platform` - The platform to timeout the user on (:twitch, :youtube, etc.)
  - `target_user_id` - Platform-specific identifier of the user to timeout
  - `duration_seconds` - Duration of the timeout in seconds
  - `reason` - Optional reason for the timeout

  ## Returns
  - `{:ok, timeout_id}` - User timed out successfully
  - `{:error, reason}` - Failed to timeout user
  """
  def timeout_user(user_id, platform, target_user_id, duration_seconds, reason \\ nil) do
    execute_on_single_platform(user_id, platform, fn platform_module ->
      platform_module.timeout_user(user_id, target_user_id, duration_seconds, reason)
    end)
  end

  @doc """
  Unbans a user from the chat on a specific platform.

  ## Parameters
  - `user_id` - The user ID who owns the stream
  - `platform` - The platform to unban the user on (:twitch, :youtube, etc.)
  - `target_user_id` - Platform-specific identifier of the user to unban (or ban_id for YouTube)

  ## Returns
  - `:ok` - User unbanned successfully
  - `{:error, reason}` - Failed to unban user
  """
  def unban_user(user_id, platform, target_user_id) do
    execute_on_single_platform(user_id, platform, fn platform_module ->
      platform_module.unban_user(user_id, target_user_id)
    end)
  end

  # Helper functions

  defp execute_on_platforms(user_id, platforms, callback) do
    target_platforms = normalize_platforms(user_id, platforms)

    # Execute on all platforms concurrently
    tasks =
      Enum.map(target_platforms, fn platform ->
        Task.async(fn ->
          try do
            case Registry.lookup(
                   Streampai.LivestreamManager.Registry,
                   {:platform_manager, user_id, platform}
                 ) do
              [{pid, _}] ->
                platform_module = get_platform_module(platform)
                callback.(platform_module, pid)
                {platform, :ok}

              [] ->
                {platform, {:error, :not_found}}
            end
          rescue
            error ->
              require Logger

              Logger.error("Error executing on platform #{platform}: #{inspect(error)}")
              {platform, {:error, error}}
          catch
            kind, value ->
              require Logger

              Logger.error("Caught #{kind} while executing on platform #{platform}: #{inspect(value)}")

              {platform, {:error, {kind, value}}}
          end
        end)
      end)

    # Wait for all platforms to complete (with 10 second timeout per platform)
    Task.await_many(tasks, 10_000)

    :ok
  end

  defp execute_on_single_platform(user_id, platform, callback) do
    require Logger

    case Registry.lookup(
           Streampai.LivestreamManager.Registry,
           {:platform_manager, user_id, platform}
         ) do
      [{_pid, _}] ->
        platform_module = get_platform_module(platform)

        try do
          callback.(platform_module)
        rescue
          error ->
            Logger.error("Error executing on platform #{platform}: #{inspect(error)}")
            {:error, error}
        catch
          kind, value ->
            Logger.error("Caught #{kind} while executing on platform #{platform}: #{inspect(value)}")

            {:error, {kind, value}}
        end

      [] ->
        {:error, :platform_not_connected}
    end
  end

  defp normalize_platforms(user_id, :all), do: get_active_platforms(user_id)
  defp normalize_platforms(user_id, [:all]), do: get_active_platforms(user_id)
  defp normalize_platforms(_user_id, platforms) when is_list(platforms), do: platforms
  defp normalize_platforms(_user_id, platform) when is_atom(platform), do: [platform]

  defp via_tuple(user_id) do
    {:via, Registry, {Streampai.LivestreamManager.Registry, {:platform_supervisor, user_id}}}
  end

  defp initialize_user_platforms(user_id) do
    # Small delay to ensure supervisor is fully initialized
    Process.sleep(@initialization_delay)

    case StreamingAccount.for_user(user_id) do
      {:ok, accounts} ->
        Enum.each(accounts, fn account ->
          platform_config = %{
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.access_token_expires_at,
            extra_data: account.extra_data
          }

          start_platform_manager(user_id, account.platform, platform_config)
        end)

      {:error, _} ->
        # No connected platforms
        :ok
    end
  end

  defp get_platform_manager_spec(user_id, platform, config) do
    platform_module = get_platform_module(platform)

    %{
      id: {:platform_manager, user_id, platform},
      start: {platform_module, :start_link, [user_id, config]},
      restart: :permanent,
      type: :worker
    }
  end

  defp get_platform_module(:twitch), do: Platforms.TwitchManager
  defp get_platform_module(:youtube), do: Platforms.YouTubeManager
  defp get_platform_module(:facebook), do: Platforms.FacebookManager
  defp get_platform_module(:kick), do: Platforms.KickManager
  defp get_platform_module(:tiktok), do: Platforms.TikTokManager
  defp get_platform_module(:trovo), do: Platforms.TrovoManager
  defp get_platform_module(:instagram), do: Platforms.InstagramManager
  defp get_platform_module(:rumble), do: Platforms.RumbleManager

  defp get_active_platforms(user_id) do
    Registry.select(Streampai.LivestreamManager.Registry, [
      {{{:platform_manager, user_id, :"$1"}, :_, :_}, [], [:"$1"]}
    ])
  end
end
