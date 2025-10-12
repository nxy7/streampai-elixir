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

    case BannedViewer
         |> Ash.Query.for_read(:read)
         |> Ash.Query.filter(id == ^banned_viewer_id)
         |> Ash.read_one(actor: actor) do
      {:ok, nil} ->
        {:error, :not_found}

      {:ok, banned_viewer} ->
        case BannedViewer.unban_viewer(banned_viewer, %{}, actor: actor) do
          {:ok, updated_viewer} ->
            {:ok,
             %{
               success: true,
               banned_viewer_id: updated_viewer.id,
               message: "Viewer unbanned successfully"
             }}

          {:error, reason} ->
            {:error, reason}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end
end
