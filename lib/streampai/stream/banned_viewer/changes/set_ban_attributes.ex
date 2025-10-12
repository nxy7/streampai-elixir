defmodule Streampai.Stream.BannedViewer.Changes.SetBanAttributes do
  @moduledoc """
  Sets ban-related attributes based on duration.

  For temporary bans (timeouts):
  - Calculates expires_at based on duration_seconds
  - Sets is_active to true

  For permanent bans:
  - Sets is_active to true
  - Leaves expires_at as nil
  """
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    duration = Ash.Changeset.get_attribute(changeset, :duration_seconds)

    if duration do
      expires_at = DateTime.add(DateTime.utc_now(), duration, :second)

      changeset
      |> Ash.Changeset.force_change_attribute(:expires_at, expires_at)
      |> Ash.Changeset.force_change_attribute(:is_active, true)
    else
      Ash.Changeset.force_change_attribute(changeset, :is_active, true)
    end
  end
end
