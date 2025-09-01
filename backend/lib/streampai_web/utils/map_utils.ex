defmodule StreampaiWeb.Utils.MapUtils do
  def to_atom_keys(map) when is_map(map) do
    for {k, v} <- map, into: %{} do
      {String.to_existing_atom(k), v}
    end
  end

  def to_atom_keys(data) when is_list(data) do
    for item <- data, do: to_atom_keys(item)
  end

  def to_atom_keys(data), do: data
end
