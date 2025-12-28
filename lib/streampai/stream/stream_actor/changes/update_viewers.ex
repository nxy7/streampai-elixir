defmodule Streampai.Stream.StreamActor.Changes.UpdateViewers do
  @moduledoc """
  Updates viewer counts for a platform in the StreamActor data.

  Updates the data JSONB with:
  - viewers: Map with platform => count
  - total_viewers: Sum of all platform viewer counts

  ## Usage

      change UpdateViewers
  """
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    current_data = Ash.Changeset.get_data(changeset, :data) || %{}
    platform = Ash.Changeset.get_argument(changeset, :platform)
    viewer_count = Ash.Changeset.get_argument(changeset, :viewer_count)

    current_viewers = Map.get(current_data, "viewers", %{})
    updated_viewers = Map.put(current_viewers, to_string(platform), viewer_count)
    total = updated_viewers |> Map.values() |> Enum.sum()

    updates = %{
      "viewers" => updated_viewers,
      "total_viewers" => total,
      "last_updated_at" => DateTime.to_iso8601(DateTime.utc_now())
    }

    new_data = Map.merge(current_data, updates)
    Ash.Changeset.change_attribute(changeset, :data, new_data)
  end
end
