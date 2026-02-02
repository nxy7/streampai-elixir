defmodule Streampai.MapUtils do
  @moduledoc """
  Shared map utility functions used across the application.
  """

  @doc """
  Puts a key-value pair into the map only if the value is not nil.
  """
  @spec maybe_put(map(), any(), any()) :: map()
  def maybe_put(map, _key, nil), do: map
  def maybe_put(map, key, value), do: Map.put(map, key, value)

  @doc """
  Recursively converts all atom keys in a map to strings.
  Also handles nested maps and lists.
  """
  @spec deep_stringify_keys(map()) :: map()
  def deep_stringify_keys(map) when is_map(map) do
    Map.new(map, fn {k, v} ->
      key = if is_atom(k), do: Atom.to_string(k), else: k
      {key, deep_stringify_keys(v)}
    end)
  end

  def deep_stringify_keys(list) when is_list(list), do: Enum.map(list, &deep_stringify_keys/1)
  def deep_stringify_keys(value), do: value

  @doc """
  Converts atom keys in a map to strings (shallow, one level only).
  """
  @spec stringify_keys(map()) :: map()
  def stringify_keys(map) when is_map(map) do
    Map.new(map, fn {k, v} -> {to_string(k), v} end)
  end
end
