defmodule Streampai.Stream.Livestream.Changes.SetDefaultTitle do
  @moduledoc """
  Sets a default title for livestreams based on the livestream ID if no title is provided.
  """
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    title = Ash.Changeset.get_attribute(changeset, :title)

    if is_nil(title) || String.trim(title) == "" do
      livestream_id = Ash.Changeset.get_attribute(changeset, :id)
      default_title = "Stream #{String.slice(livestream_id, 0..7)}"
      Ash.Changeset.change_attribute(changeset, :title, default_title)
    else
      changeset
    end
  end
end
