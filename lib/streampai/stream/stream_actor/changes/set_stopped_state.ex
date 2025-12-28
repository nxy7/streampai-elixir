defmodule Streampai.Stream.StreamActor.Changes.SetStoppedState do
  @moduledoc """
  Sets the StreamActor to stopped/idle state.

  Updates the data JSONB with:
  - status: "idle"
  - Clears livestream_id
  - Resets viewers and total_viewers to empty/0
  - Sets input_streaming to false
  - status_message: from argument or default "Stream ended"

  ## Usage

      change SetStoppedState
  """
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    current_data = Ash.Changeset.get_data(changeset, :data) || %{}
    status_message = Ash.Changeset.get_argument(changeset, :status_message)

    updates = %{
      "status" => "idle",
      "livestream_id" => nil,
      "viewers" => %{},
      "total_viewers" => 0,
      "input_streaming" => false,
      "status_message" => status_message || "Stream ended",
      "last_updated_at" => DateTime.to_iso8601(DateTime.utc_now())
    }

    new_data = Map.merge(current_data, updates)
    Ash.Changeset.change_attribute(changeset, :data, new_data)
  end
end
