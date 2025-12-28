defmodule Streampai.Integrations.DiscordActor.Changes.UpdateConnectionStatus do
  @moduledoc """
  Updates the connection status in the data JSONB field.

  Supports the following arguments:
  - `:status` - Connection status atom (required)
  - `:last_error` - Error message string (optional)
  - `:last_error_at` - Error timestamp as UTC datetime (optional)

  Status and error fields are converted to strings/ISO8601 format for JSON storage.
  """

  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    current_data = Ash.Changeset.get_data(changeset, :data) || %{}
    status = Ash.Changeset.get_argument(changeset, :status)
    last_error = Ash.Changeset.get_argument(changeset, :last_error)
    last_error_at = Ash.Changeset.get_argument(changeset, :last_error_at)

    updates = %{"status" => to_string(status)}
    updates = if last_error, do: Map.put(updates, "last_error", last_error), else: updates

    updates =
      if last_error_at,
        do: Map.put(updates, "last_error_at", DateTime.to_iso8601(last_error_at)),
        else: updates

    new_data = Map.merge(current_data, updates)
    Ash.Changeset.change_attribute(changeset, :data, new_data)
  end
end
