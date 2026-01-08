defmodule Streampai.Repo.Migrations.TruncateStreamEventsAndAddChatIndexes do
  use Ecto.Migration

  def up do
    # Prune old stream_events data — the data column now uses a typed union
    # with a "type" tag key that old rows don't have.
    execute("TRUNCATE stream_events")

    # Partial index for chat message queries by user
    execute("""
    CREATE INDEX idx_stream_events_chat_message
    ON stream_events (user_id, inserted_at)
    WHERE type = 'chat_message'
    """)

    # Enable pg_trgm for ILIKE search if not already enabled
    execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    # GIN trigram index for chat message text search
    execute("""
    CREATE INDEX idx_stream_events_chat_search
    ON stream_events USING gin (
      (data->>'message') gin_trgm_ops,
      (data->>'username') gin_trgm_ops
    )
    WHERE type = 'chat_message'
    """)
  end

  def down do
    execute("DROP INDEX IF EXISTS idx_stream_events_chat_search")
  end
end
