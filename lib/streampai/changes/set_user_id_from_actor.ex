defmodule Streampai.Changes.SetUserIdFromActor do
  @moduledoc """
  Reusable Ash change module that sets the user_id attribute from the current actor.

  This ensures that resources are always associated with the authenticated user
  making the request, preventing users from creating resources for other users.

  ## Usage

  Add to any Ash resource's changes block:

      changes do
        change Streampai.Changes.SetUserIdFromActor, on: [:create]
      end

  The change will:
  - Set `user_id` to the actor's id when an actor is present
  - Leave the changeset unchanged if no actor is present (allowing system operations)
  """
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, context) do
    case context.actor do
      %{id: actor_id} when not is_nil(actor_id) ->
        Ash.Changeset.force_change_attribute(changeset, :user_id, actor_id)

      _ ->
        changeset
    end
  end
end
