defmodule Streampai.Integrations.DiscordActor.Changes.InitializeData do
  @moduledoc """
  Initializes the data JSONB field when creating a new DiscordActor.

  Sets up the initial structure with bot configuration and default values
  for status, event types, guilds, channels, and message counters.
  """

  use Ash.Resource.Change

  @default_event_types [:donation, :stream_start, :stream_end]

  @impl true
  def change(changeset, _opts, _context) do
    bot_token = Ash.Changeset.get_argument(changeset, :bot_token)
    bot_name = Ash.Changeset.get_argument(changeset, :bot_name)
    event_types = Ash.Changeset.get_argument(changeset, :event_types) || @default_event_types

    data = %{
      "bot_token" => bot_token,
      "bot_name" => bot_name,
      "status" => "disconnected",
      "event_types" => Enum.map(event_types, &to_string/1),
      "guilds" => [],
      "channels" => %{},
      "messages_sent" => 0
    }

    Ash.Changeset.change_attribute(changeset, :data, data)
  end
end
