defmodule Streampai.Stream.StreamActor.Changes.UpdateData do
  @moduledoc """
  Updates specified fields in the data JSONB attribute for a StreamActor.

  This is a generic change that can update any subset of fields in the data map
  based on action arguments.

  ## Options

  - `:fields` - List of field names (atoms) to update from action arguments.
    The :status field is automatically converted to string.

  ## Usage

      change {UpdateData, fields: [:status, :status_message, :livestream_id]}
  """
  use Ash.Resource.Change

  @impl true
  def change(changeset, opts, _context) do
    fields = Keyword.fetch!(opts, :fields)
    current_data = Ash.Changeset.get_data(changeset, :data) || %{}

    updates =
      fields
      |> Enum.reduce(%{}, fn key, acc ->
        case Ash.Changeset.get_argument(changeset, key) do
          nil -> acc
          value when key == :status -> Map.put(acc, to_string(key), to_string(value))
          value -> Map.put(acc, to_string(key), value)
        end
      end)
      |> Map.put("last_updated_at", DateTime.to_iso8601(DateTime.utc_now()))

    new_data = Map.merge(current_data, updates)
    Ash.Changeset.change_attribute(changeset, :data, new_data)
  end
end
