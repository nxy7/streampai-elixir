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

  alias Streampai.Stream.ModerationAction.Actions.BanViewer
  alias Streampai.Stream.ModerationAction.Actions.UnbanViewer
  alias Streampai.Stream.StreamAction.Checks.IsStreamOwnerOrModerator

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

      run BanViewer
    end

    action :unban_viewer, :map do
      description "Unban a viewer from a specific platform"

      argument :user_id, :uuid, allow_nil?: false
      argument :banned_viewer_id, :uuid, allow_nil?: false

      run UnbanViewer
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
end
