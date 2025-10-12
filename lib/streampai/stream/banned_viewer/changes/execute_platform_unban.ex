defmodule Streampai.Stream.BannedViewer.Changes.ExecutePlatformUnban do
  @moduledoc """
  Executes the platform-specific unban after updating a BannedViewer record.

  This change hooks into the unban_viewer action's after_action to:
  1. Execute the unban on the platform via PlatformManager
  2. Roll back the transaction if the platform unban fails

  This ensures transactional safety - if the platform unban fails, the database
  record update is rolled back.
  """
  use Ash.Resource.Change

  alias Streampai.LivestreamManager.PlatformRegistry

  require Logger

  @impl true
  def change(changeset, _opts, _context) do
    Ash.Changeset.after_action(changeset, fn _changeset, updated_viewer ->
      user_id = updated_viewer.user_id
      platform = updated_viewer.platform
      viewer_platform_id = updated_viewer.viewer_platform_id
      viewer_username = updated_viewer.viewer_username
      platform_ban_id = updated_viewer.platform_ban_id

      case execute_platform_unban(user_id, platform, viewer_platform_id, platform_ban_id) do
        :ok ->
          {:ok, updated_viewer}

        {:error, reason} ->
          Logger.error("Platform unban failed for #{viewer_username} on #{platform}: #{inspect(reason)}")

          {:error, reason}
      end
    end)
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
    with {:ok, manager_module} <- PlatformRegistry.get_manager(platform),
         {:ok, _status} <- manager_module.get_status(user_id) do
      {:ok, manager_module}
    else
      {:error, :unknown_platform} ->
        {:error, {:platform_manager_unavailable, platform}}

      {:error, _status_error} ->
        {:error, {:manager_not_running, %{user_id: user_id, platform: platform}}}
    end
  end
end
