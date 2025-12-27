defmodule Streampai.Repo.Migrations.DropDiscordActors do
  @moduledoc """
  Drop the discord_actors table.

  DiscordActor resource has been refactored to use the shared actor_states table
  with type="DiscordActor" instead of its own dedicated table.
  """
  use Ecto.Migration

  def up do
    # Drop indexes first
    drop_if_exists index(:discord_actors, [:user_id], name: "idx_discord_actors_user_id")
    drop_if_exists index(:discord_actors, [:status], name: "idx_discord_actors_status")

    # Drop the table
    drop_if_exists table(:discord_actors)

    # Remove the Ash snapshot file
    # Note: You may need to manually delete priv/resource_snapshots/repo/discord_actors/
  end

  def down do
    # Recreate the table if needed to rollback
    create table(:discord_actors, primary_key: false) do
      add :id, :uuid, null: false, primary_key: true
      add :bot_token, :text, null: false
      add :bot_name, :text
      add :status, :text, null: false, default: "disconnected"
      add :event_types, {:array, :text}, null: false, default: []
      add :announcement_guild_id, :text
      add :announcement_channel_id, :text
      add :actor_state, :map, null: false, default: %{}
      add :last_connected_at, :utc_datetime_usec
      add :last_synced_at, :utc_datetime_usec
      add :last_error, :text
      add :last_error_at, :utc_datetime_usec
      add :messages_sent, :bigint, null: false, default: 0

      add :user_id, references(:users, type: :uuid, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime_usec)
    end

    create index(:discord_actors, [:user_id], name: "idx_discord_actors_user_id")
    create index(:discord_actors, [:status], name: "idx_discord_actors_status")
  end
end
