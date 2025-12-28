defmodule Streampai.Integrations.DiscordActor.Changes.MergeDataFromArguments do
  @moduledoc """
  Merges argument values into the data JSONB field during updates.

  Supports the following arguments:
  - `:bot_token` - Discord bot token
  - `:bot_name` - Friendly name for the bot
  - `:event_types` - List of event types (converted to strings)
  - `:announcement_guild_id` - Selected guild for announcements
  - `:announcement_channel_id` - Selected channel for announcements

  Only non-nil arguments are merged into the existing data.
  """

  use Ash.Resource.Change

  @argument_keys [
    :bot_token,
    :bot_name,
    :event_types,
    :announcement_guild_id,
    :announcement_channel_id
  ]

  @impl true
  def change(changeset, _opts, _context) do
    current_data = Ash.Changeset.get_data(changeset, :data) || %{}

    updates =
      Enum.reduce(@argument_keys, %{}, fn key, acc ->
        case Ash.Changeset.get_argument(changeset, key) do
          nil ->
            acc

          value when key == :event_types ->
            Map.put(acc, to_string(key), Enum.map(value, &to_string/1))

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
