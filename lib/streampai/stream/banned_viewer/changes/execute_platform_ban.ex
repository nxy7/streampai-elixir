defmodule Streampai.Stream.BannedViewer.Changes.ExecutePlatformBan do
  @moduledoc """
  Executes the platform-specific ban after creating a BannedViewer record.

  This change hooks into the ban_viewer action's after_action to:
  1. Execute the ban on the platform via PlatformManager
  2. Update the BannedViewer record with platform_ban_id if returned (YouTube)
  3. Roll back the transaction if the platform ban fails

  This ensures transactional safety - if the platform ban fails, the database
  record creation is rolled back.
  """
  use Ash.Resource.Change

  alias Streampai.LivestreamManager.PlatformRegistry

  require Logger

  @impl true
  def change(changeset, _opts, context) do
    Ash.Changeset.after_action(changeset, fn _changeset, banned_viewer ->
      user_id = banned_viewer.user_id
      platform = banned_viewer.platform
      viewer_platform_id = banned_viewer.viewer_platform_id
      viewer_username = banned_viewer.viewer_username
      reason = banned_viewer.reason
      duration_seconds = banned_viewer.duration_seconds

      case execute_platform_ban(
             user_id,
             platform,
             viewer_platform_id,
             reason,
             duration_seconds
           ) do
        {:ok, platform_ban_id} when not is_nil(platform_ban_id) ->
          banned_viewer
          |> Ash.Changeset.for_update(:update, %{platform_ban_id: platform_ban_id})
          |> Ash.update(actor: context.actor)

        {:ok, nil} ->
          {:ok, banned_viewer}

        {:error, reason} ->
          Logger.error("Platform ban failed for #{viewer_username} on #{platform}: #{inspect(reason)}")

          {:error, reason}
      end
    end)
  end

  defp execute_platform_ban(user_id, platform, viewer_platform_id, reason, duration_seconds) do
    with {:ok, manager_module} <- get_platform_manager(user_id, platform),
         {:ok, result} <-
           call_ban_method(manager_module, user_id, viewer_platform_id, reason, duration_seconds) do
      extract_ban_id(result)
    end
  end

  defp call_ban_method(manager_module, user_id, viewer_platform_id, reason, nil) do
    manager_module.ban_user(user_id, viewer_platform_id, reason)
  end

  defp call_ban_method(manager_module, user_id, viewer_platform_id, reason, duration_seconds) do
    manager_module.timeout_user(user_id, viewer_platform_id, duration_seconds, reason)
  end

  defp extract_ban_id(%{"id" => id}), do: {:ok, id}
  defp extract_ban_id(_), do: {:ok, nil}

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
