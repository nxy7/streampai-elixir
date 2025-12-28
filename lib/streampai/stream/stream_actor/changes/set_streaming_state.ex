defmodule Streampai.Stream.StreamActor.Changes.SetStreamingState do
  @moduledoc """
  Sets the StreamActor to streaming state.

  Updates the data JSONB with:
  - status: "streaming"
  - livestream_id: from argument
  - started_at: current timestamp
  - status_message: from argument or default "Streaming to platforms"
  - Clears error_message and error_at

  ## Usage

      change SetStreamingState
  """
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    current_data = Ash.Changeset.get_data(changeset, :data) || %{}
    livestream_id = Ash.Changeset.get_argument(changeset, :livestream_id)
    status_message = Ash.Changeset.get_argument(changeset, :status_message)

    now = DateTime.to_iso8601(DateTime.utc_now())

    updates = %{
      "status" => "streaming",
      "livestream_id" => livestream_id,
      "started_at" => now,
      "error_message" => nil,
      "error_at" => nil,
      "status_message" => status_message || "Streaming to platforms",
      "last_updated_at" => now
    }

    new_data = Map.merge(current_data, updates)
    Ash.Changeset.change_attribute(changeset, :data, new_data)
  end
end
