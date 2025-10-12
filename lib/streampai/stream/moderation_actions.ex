defmodule Streampai.Stream.ModerationActions do
  @moduledoc """
  Centralized moderation actions that coordinate between BannedViewer records
  and platform-specific ban implementations.

  This module provides a unified interface for banning/unbanning viewers across
  all platforms. It handles:
  1. Creating/updating BannedViewer database records
  2. Coordinating with platform managers to execute actual bans
  3. Transactional safety - DB records rollback if platform ban fails

  The caller doesn't need to know about platform managers - just provide the
  platform and viewer info, and this module handles the coordination.
  """

  alias Streampai.LivestreamManager.PlatformRegistry
  alias Streampai.Stream.BannedViewer

  require Ash.Query
  require Logger

  @doc """
  Ban a viewer on a specific platform.

  This creates a BannedViewer record and executes the ban on the platform.
  If the platform ban fails, the database transaction is rolled back.

  ## Parameters
  - `user_id`: The streamer's user ID
  - `platform`: Platform atom (:twitch, :kick, :youtube, etc.)
  - `viewer_platform_id`: The viewer's platform-specific user ID
  - `viewer_username`: The viewer's username
  - `opts`: Keyword list of options
    - `:reason` - Reason for the ban
    - `:duration_seconds` - Duration for timeout (omit for permanent ban)
    - `:livestream_id` - Current livestream ID (optional)

  ## Returns
  - `{:ok, banned_viewer}` - Successfully banned
  - `{:error, reason}` - Ban failed

  ## Example
      # Permanent ban
      ModerationActions.ban_viewer(
        user_id,
        :twitch,
        "12345678",
        "spammer123",
        reason: "Spam",
        livestream_id: livestream_id
      )

      # 5 minute timeout
      ModerationActions.ban_viewer(
        user_id,
        :kick,
        "98765",
        "annoying_user",
        duration_seconds: 300,
        reason: "Excessive caps"
      )
  """
  def ban_viewer(user_id, platform, viewer_platform_id, viewer_username, opts \\ []) do
    reason = Keyword.get(opts, :reason)
    duration_seconds = Keyword.get(opts, :duration_seconds)
    livestream_id = Keyword.get(opts, :livestream_id)

    # Create BannedViewer record with an after_action hook to execute platform ban
    BannedViewer
    |> Ash.Changeset.for_create(:ban_viewer, %{
      user_id: user_id,
      platform: platform,
      viewer_platform_id: viewer_platform_id,
      viewer_username: viewer_username,
      reason: reason,
      duration_seconds: duration_seconds,
      livestream_id: livestream_id
    })
    |> Ash.Changeset.after_action(fn _changeset, banned_viewer ->
      # Execute platform-specific ban
      case execute_platform_ban(user_id, platform, viewer_platform_id, reason, duration_seconds) do
        {:ok, platform_ban_id} ->
          # Update the record with platform_ban_id if provided (YouTube returns this)
          if platform_ban_id do
            banned_viewer
            |> Ash.Changeset.for_update(:update, %{platform_ban_id: platform_ban_id})
            |> Ash.update()
          else
            {:ok, banned_viewer}
          end

        {:error, reason} ->
          Logger.error("Platform ban failed for #{viewer_username} on #{platform}: #{inspect(reason)}")

          {:error, reason}
      end
    end)
    |> Ash.create()
  end

  @doc """
  Unban a viewer from a specific platform.

  This marks the BannedViewer record as inactive and executes the unban on the platform.
  If the platform unban fails, the database transaction is rolled back.

  ## Parameters
  - `banned_viewer_id`: The BannedViewer record ID
  - `user_id`: The streamer's user ID (for looking up platform manager)

  ## Returns
  - `{:ok, banned_viewer}` - Successfully unbanned
  - `{:error, reason}` - Unban failed

  ## Example
      ModerationActions.unban_viewer(banned_viewer_id, user_id)
  """
  def unban_viewer(banned_viewer_id, user_id) do
    # Get the banned viewer record
    case BannedViewer
         |> Ash.Query.for_read(:read)
         |> Ash.Query.filter(id == ^banned_viewer_id)
         |> Ash.read_one() do
      {:ok, nil} ->
        {:error, :not_found}

      {:ok, banned_viewer} ->
        # Update record with after_action hook to execute platform unban
        banned_viewer
        |> Ash.Changeset.for_update(:unban_viewer)
        |> Ash.Changeset.after_action(fn _changeset, updated_viewer ->
          # Execute platform-specific unban
          case execute_platform_unban(
                 user_id,
                 banned_viewer.platform,
                 banned_viewer.viewer_platform_id,
                 banned_viewer.platform_ban_id
               ) do
            :ok ->
              {:ok, updated_viewer}

            {:error, reason} ->
              Logger.error(
                "Platform unban failed for #{banned_viewer.viewer_username} on #{banned_viewer.platform}: #{inspect(reason)}"
              )

              {:error, reason}
          end
        end)
        |> Ash.update()

      {:error, reason} ->
        {:error, reason}
    end
  end

  # Private functions

  defp execute_platform_ban(user_id, platform, viewer_platform_id, reason, duration_seconds) do
    case get_platform_manager(user_id, platform) do
      {:ok, manager_module} ->
        if duration_seconds do
          # Timeout
          case manager_module.timeout_user(
                 user_id,
                 viewer_platform_id,
                 duration_seconds,
                 reason
               ) do
            {:ok, ban_data} when is_map(ban_data) ->
              # YouTube returns ban data with ID
              {:ok, Map.get(ban_data, "id")}

            {:ok, _} ->
              {:ok, nil}

            {:error, reason} ->
              {:error, reason}
          end
        else
          # Permanent ban
          case manager_module.ban_user(user_id, viewer_platform_id, reason) do
            {:ok, ban_data} when is_map(ban_data) ->
              # YouTube returns ban data with ID
              {:ok, Map.get(ban_data, "id")}

            {:ok, _} ->
              {:ok, nil}

            {:error, reason} ->
              {:error, reason}
          end
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp execute_platform_unban(user_id, platform, viewer_platform_id, platform_ban_id) do
    case get_platform_manager(user_id, platform) do
      {:ok, manager_module} ->
        # For YouTube, use platform_ban_id if available, otherwise use viewer_platform_id
        unban_id = platform_ban_id || viewer_platform_id
        manager_module.unban_user(user_id, unban_id)

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp get_platform_manager(user_id, platform) do
    case PlatformRegistry.get_manager(platform) do
      {:ok, manager_module} ->
        # Verify the manager is running for this user
        case manager_module.get_status(user_id) do
          {:ok, _status} ->
            {:ok, manager_module}

          {:error, _} ->
            {:error, :manager_not_running}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end
end
