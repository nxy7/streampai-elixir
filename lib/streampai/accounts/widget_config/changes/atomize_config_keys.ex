defmodule Streampai.Accounts.WidgetConfig.Changes.AtomizeConfigKeys do
  @moduledoc """
  Converts config map string keys to atom keys for validation.
  This is needed because JSON parsing produces maps with string keys,
  but our validations expect atom keys.
  """

  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    case Ash.Changeset.get_attribute(changeset, :config) do
      nil ->
        changeset

      config when is_map(config) ->
        atomized_config = atomize_keys(config)
        Ash.Changeset.force_change_attribute(changeset, :config, atomized_config)

      _ ->
        changeset
    end
  end

  defp atomize_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_binary(k) -> {String.to_existing_atom(k), v}
      {k, v} -> {k, v}
    end)
  rescue
    ArgumentError ->
      # If atom doesn't exist, return original map
      map
  end
end
