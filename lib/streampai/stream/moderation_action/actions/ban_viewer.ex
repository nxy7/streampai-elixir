defmodule Streampai.Stream.ModerationAction.Actions.BanViewer do
  @moduledoc """
  Bans a viewer by creating a BannedViewer record.

  Delegates to the BannedViewer resource which handles:
  1. Creating the database record
  2. Executing the platform-specific ban via ExecutePlatformBan change
  3. Transactional rollback if platform ban fails

  Returns a map with success status and banned_viewer_id.
  """
  alias Streampai.Stream.BannedViewer

  def run(input, context) do
    params = %{
      user_id: input.arguments.user_id,
      platform: input.arguments.platform,
      viewer_platform_id: input.arguments.viewer_platform_id,
      viewer_username: input.arguments.viewer_username,
      reason: input.arguments[:reason],
      duration_seconds: input.arguments[:duration_seconds],
      livestream_id: input.arguments[:livestream_id]
    }

    case BannedViewer.ban_viewer(params, actor: context.actor) do
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
