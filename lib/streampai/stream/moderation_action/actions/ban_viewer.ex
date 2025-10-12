defmodule Streampai.Stream.ModerationAction.Actions.BanViewer do
  @moduledoc """
  Creates a BannedViewer record and executes the platform-specific ban.

  This action handles the full ban workflow:
  1. Creates BannedViewer database record
  2. Executes platform ban via PlatformManager
  3. Updates record with platform_ban_id if provided (YouTube)
  4. Rolls back transaction if platform ban fails

  Returns a map with success status and banned_viewer_id.
  """
  alias Streampai.LivestreamManager.PlatformRegistry
  alias Streampai.Stream.BannedViewer

  require Logger

  def run(input, context) do
    user_id = input.arguments.user_id
    platform = input.arguments.platform
    viewer_platform_id = input.arguments.viewer_platform_id
    viewer_username = input.arguments.viewer_username
    reason = input.arguments[:reason]
    duration_seconds = input.arguments[:duration_seconds]
    livestream_id = input.arguments[:livestream_id]
    actor = context.actor

    case create_ban_record(
           actor,
           user_id,
           platform,
           viewer_platform_id,
           viewer_username,
           reason,
           duration_seconds,
           livestream_id
         ) do
      {:ok, banned_viewer} ->
        {:ok,
         %{
           success: true,
           banned_viewer_id: banned_viewer.id,
           message: "Viewer banned successfully"
         }}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp create_ban_record(
         actor,
         user_id,
         platform,
         viewer_platform_id,
         viewer_username,
         reason,
         duration_seconds,
         livestream_id
       ) do
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
      case execute_platform_ban(
             user_id,
             platform,
             viewer_platform_id,
             reason,
             duration_seconds
           ) do
        {:ok, platform_ban_id} ->
          if platform_ban_id do
            banned_viewer
            |> Ash.Changeset.for_update(:update, %{platform_ban_id: platform_ban_id})
            |> Ash.update(actor: actor)
          else
            {:ok, banned_viewer}
          end

        {:error, reason} ->
          Logger.error("Platform ban failed for #{viewer_username} on #{platform}: #{inspect(reason)}")

          {:error, reason}
      end
    end)
    |> Ash.create(actor: actor)
  end

  defp execute_platform_ban(user_id, platform, viewer_platform_id, reason, duration_seconds) do
    case get_platform_manager(user_id, platform) do
      {:ok, manager_module} ->
        if duration_seconds do
          case manager_module.timeout_user(
                 user_id,
                 viewer_platform_id,
                 duration_seconds,
                 reason
               ) do
            {:ok, ban_data} when is_map(ban_data) ->
              {:ok, Map.get(ban_data, "id")}

            {:ok, _} ->
              {:ok, nil}

            {:error, reason} ->
              {:error, reason}
          end
        else
          case manager_module.ban_user(user_id, viewer_platform_id, reason) do
            {:ok, ban_data} when is_map(ban_data) ->
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

  defp get_platform_manager(user_id, platform) do
    case PlatformRegistry.get_manager(platform) do
      {:ok, manager_module} ->
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
