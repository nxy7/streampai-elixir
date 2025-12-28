defmodule Streampai.Integrations.DiscordActor.Changes.IncrementMessagesSent do
  @moduledoc """
  Increments the messages_sent counter in the data JSONB field.

  This change is used when recording that a message has been sent
  via the Discord bot. The counter starts at 0 if not present.
  """

  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    current_data = Ash.Changeset.get_data(changeset, :data) || %{}
    current_count = Map.get(current_data, "messages_sent", 0)
    new_data = Map.put(current_data, "messages_sent", current_count + 1)
    Ash.Changeset.change_attribute(changeset, :data, new_data)
  end
end
