defmodule Streampai.Stream.PlatformStatus do
  @moduledoc """
  Represents the current status of a single streaming platform.

  Stored as a JSONB column in `current_stream_data` (e.g. `youtube_data`, `twitch_data`).
  """

  @enforce_keys [:status]
  defstruct [
    :status,
    :started_at,
    :error_message,
    :error_at,
    :viewer_count,
    :title,
    :category,
    :url
  ]

  @type t :: %__MODULE__{
          status: :starting | :live | :stopping | :error,
          started_at: String.t() | nil,
          error_message: String.t() | nil,
          error_at: String.t() | nil,
          viewer_count: non_neg_integer() | nil,
          title: String.t() | nil,
          category: String.t() | nil,
          url: String.t() | nil
        }

  @doc """
  Creates a new PlatformStatus struct.
  """
  def new(status, opts \\ []) do
    %__MODULE__{
      status: status,
      started_at: opts[:started_at],
      error_message: opts[:error_message],
      error_at: opts[:error_at],
      viewer_count: opts[:viewer_count],
      title: opts[:title],
      category: opts[:category],
      url: opts[:url]
    }
  end

  @doc """
  Converts a PlatformStatus struct to a string-keyed map for JSONB storage.
  """
  def to_map(%__MODULE__{} = ps) do
    %{
      "status" => to_string(ps.status),
      "started_at" => ps.started_at,
      "error_message" => ps.error_message,
      "error_at" => ps.error_at,
      "viewer_count" => ps.viewer_count,
      "title" => ps.title,
      "category" => ps.category,
      "url" => ps.url
    }
  end

  @doc """
  Reconstructs a PlatformStatus struct from a string-keyed map (JSONB).
  """
  def from_map(map) when is_map(map) do
    %__MODULE__{
      status: parse_status(map["status"]),
      started_at: map["started_at"],
      error_message: map["error_message"],
      error_at: map["error_at"],
      viewer_count: map["viewer_count"],
      title: map["title"],
      category: map["category"],
      url: map["url"]
    }
  end

  @doc """
  Merges new fields into an existing PlatformStatus map (string-keyed).
  Only non-nil values from the new struct overwrite existing values.
  """
  def merge_into_map(existing_map, %__MODULE__{} = ps) do
    new_map = to_map(ps)

    Enum.reduce(new_map, existing_map, fn {key, value}, acc ->
      if is_nil(value), do: acc, else: Map.put(acc, key, value)
    end)
  end

  defp parse_status("starting"), do: :starting
  defp parse_status("live"), do: :live
  defp parse_status("stopping"), do: :stopping
  defp parse_status("error"), do: :error
  defp parse_status(_), do: :error
end
