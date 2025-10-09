defmodule Streampai.Stream.MetadataHelper do
  @moduledoc """
  Helper functions for stream metadata handling.
  """

  @doc """
  Gets stream title from metadata with fallback to generated title.
  Returns the provided title if present, otherwise generates a default title using the livestream ID.
  """
  def get_stream_title(metadata, livestream_id) do
    case Map.get(metadata, :title) do
      title when title in [nil, ""] -> "Live Stream - #{livestream_id}"
      title -> title
    end
  end

  @doc """
  Adds description to a snippet map if description is present and non-empty.
  """
  def maybe_add_description(snippet, nil), do: snippet
  def maybe_add_description(snippet, ""), do: snippet
  def maybe_add_description(snippet, description), do: Map.put(snippet, :description, description)
end
