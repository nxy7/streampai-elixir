defmodule Streampai.Stream.ModerationAction.Actions.UnbanViewer do
  @moduledoc """
  Unbans a viewer by updating the BannedViewer record.

  Delegates to the BannedViewer resource which handles:
  1. Fetching the BannedViewer record
  2. Marking it as inactive
  3. Executing the platform-specific unban via ExecutePlatformUnban change
  4. Transactional rollback if platform unban fails

  Returns a map with success status and banned_viewer_id.
  """
  alias Streampai.Stream.BannedViewer

  require Ash.Query

  def run(input, context) do
    banned_viewer_id = input.arguments.banned_viewer_id
    actor = context.actor

    with {:ok, banned_viewer} <- fetch_banned_viewer(banned_viewer_id, actor),
         {:ok, updated_viewer} <- BannedViewer.unban_viewer(banned_viewer, %{}, actor: actor) do
      {:ok,
       %{
         success: true,
         banned_viewer_id: updated_viewer.id,
         message: "Viewer unbanned successfully"
       }}
    end
  end

  defp fetch_banned_viewer(id, actor) do
    case BannedViewer
         |> Ash.Query.for_read(:read)
         |> Ash.Query.filter(id == ^id)
         |> Ash.read_one(actor: actor) do
      {:ok, nil} -> {:error, :not_found}
      result -> result
    end
  end
end
