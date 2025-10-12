defmodule Streampai.Stream.BannedViewer.Changes.SetUnbanAttributes do
  @moduledoc """
  Sets unban-related attributes when unbanning a viewer.

  Sets:
  - is_active to false (marks ban as inactive)
  - unbanned_at to current timestamp
  """
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    changeset
    |> Ash.Changeset.force_change_attribute(:is_active, false)
    |> Ash.Changeset.force_change_attribute(:unbanned_at, DateTime.utc_now())
  end
end
