defmodule Streampai.Stream.StreamActor.Changes.SetErrorState do
  @moduledoc """
  Sets the StreamActor to error state.

  Updates the data JSONB with:
  - status: "error"
  - error_message: from argument
  - error_at: current timestamp
  - status_message: "Error: {error_message}"

  ## Usage

      change SetErrorState
  """
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    current_data = Ash.Changeset.get_data(changeset, :data) || %{}
    error_message = Ash.Changeset.get_argument(changeset, :error_message)

    now = DateTime.to_iso8601(DateTime.utc_now())

    updates = %{
      "status" => "error",
      "error_message" => error_message,
      "error_at" => now,
      "status_message" => "Error: #{error_message}",
      "last_updated_at" => now
    }

    new_data = Map.merge(current_data, updates)
    Ash.Changeset.change_attribute(changeset, :data, new_data)
  end
end
