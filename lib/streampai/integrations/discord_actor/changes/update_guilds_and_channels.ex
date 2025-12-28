defmodule Streampai.Integrations.DiscordActor.Changes.UpdateGuildsAndChannels do
  @moduledoc """
  Updates guilds and channels data in the data JSONB field.

  Supports the following arguments:
  - `:guilds` - List of guild maps (optional)
  - `:channels` - Map of guild_id => channel list (optional)
  - `:last_synced_at` - Sync timestamp as UTC datetime (optional)

  Only non-nil arguments are merged into the existing data.
  Datetime values are converted to ISO8601 format for JSON storage.
  """

  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    current_data = Ash.Changeset.get_data(changeset, :data) || %{}

    updates =
      Enum.reduce([:guilds, :channels, :last_synced_at], %{}, fn key, acc ->
        case Ash.Changeset.get_argument(changeset, key) do
          nil ->
            acc

          value when key == :last_synced_at ->
            Map.put(acc, to_string(key), DateTime.to_iso8601(value))

          value ->
            Map.put(acc, to_string(key), value)
        end
      end)

    if map_size(updates) > 0 do
      new_data = Map.merge(current_data, updates)
      Ash.Changeset.change_attribute(changeset, :data, new_data)
    else
      changeset
    end
  end
end
