defmodule Streampai.Repo.Migrations.DropChatMessages do
  use Ecto.Migration

  def up do
    drop_if_exists table(:chat_messages)
  end

  def down do
    # chat_messages table is no longer used - all chat data lives in stream_events
    :ok
  end
end
