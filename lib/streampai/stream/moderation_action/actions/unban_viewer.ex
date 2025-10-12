defmodule Streampai.Stream.ModerationAction.Actions.UnbanViewer do
  @moduledoc """
  Marks a BannedViewer record as inactive and executes the platform-specific unban.

  This action handles the full unban workflow:
  1. Fetches BannedViewer record
  2. Marks record as inactive with unbanned_at timestamp
  3. Executes platform unban via PlatformManager
  4. Rolls back transaction if platform unban fails

  Returns a map with success status and banned_viewer_id.
  """
  alias Streampai.LivestreamManager.PlatformRegistry
  alias Streampai.Stream.BannedViewer

  require Ash.Query
  require Logger

  def run(input, context) do
    user_id = input.arguments.user_id
    banned_viewer_id = input.arguments.banned_viewer_id
    actor = context.actor

    case unban_viewer_record(actor, banned_viewer_id, user_id) do
      {:ok, banned_viewer} ->
        {:ok,
         %{
           success: true,
           banned_viewer_id: banned_viewer.id,
           message: "Viewer unbanned successfully"
         }}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp unban_viewer_record(actor, banned_viewer_id, user_id) do
    case BannedViewer
         |> Ash.Query.for_read(:read)
         |> Ash.Query.filter(id == ^banned_viewer_id)
         |> Ash.read_one(actor: actor) do
      {:ok, nil} ->
        {:error, :not_found}

      {:ok, banned_viewer} ->
        banned_viewer
        |> Ash.Changeset.for_update(:unban_viewer)
        |> Ash.Changeset.after_action(fn _changeset, updated_viewer ->
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
        |> Ash.update(actor: actor)

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp execute_platform_unban(user_id, platform, viewer_platform_id, platform_ban_id) do
    case get_platform_manager(user_id, platform) do
      {:ok, manager_module} ->
        unban_id = platform_ban_id || viewer_platform_id
        manager_module.unban_user(user_id, unban_id)

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
