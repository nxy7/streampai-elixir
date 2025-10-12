defmodule Streampai.Stream.ModerationAction do
  @moduledoc """
  Ash resource for moderation actions.

  This is a stateless resource (no database storage) that provides
  authorization-aware actions for viewer moderation across platforms.
  It creates BannedViewer records and coordinates with platform managers
  to execute actual bans/unbans.

  All actions require an actor and validate permissions before executing.
  Actions are transactional - if the platform ban/unban fails, the database
  record creation/update is rolled back.
  """
  use Ash.Resource,
    domain: Streampai.Stream,
    data_layer: :embedded,
    authorizers: [Ash.Policy.Authorizer]

  alias Streampai.LivestreamManager.PlatformRegistry
  alias Streampai.Stream.BannedViewer
  alias Streampai.Stream.StreamAction.Checks.IsStreamOwnerOrModerator

  require Ash.Query
  require Logger

  code_interface do
    define :ban_viewer
    define :unban_viewer
  end

  actions do
    defaults []

    action :ban_viewer, :map do
      description "Ban a viewer on a specific platform"

      argument :user_id, :uuid, allow_nil?: false
      argument :platform, :atom, allow_nil?: false
      argument :viewer_platform_id, :string, allow_nil?: false
      argument :viewer_username, :string, allow_nil?: false
      argument :reason, :string, allow_nil?: true
      argument :duration_seconds, :integer, allow_nil?: true
      argument :livestream_id, :uuid, allow_nil?: true

      run fn input, context ->
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
    end

    action :unban_viewer, :map do
      description "Unban a viewer from a specific platform"

      argument :user_id, :uuid, allow_nil?: false
      argument :banned_viewer_id, :uuid, allow_nil?: false

      run fn input, context ->
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
    end
  end

  policies do
    policy action(:ban_viewer) do
      description "Stream owner and moderators can ban viewers"
      authorize_if IsStreamOwnerOrModerator
      access_type :strict
    end

    policy action(:unban_viewer) do
      description "Stream owner and moderators can unban viewers"
      authorize_if IsStreamOwnerOrModerator
      access_type :strict
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
