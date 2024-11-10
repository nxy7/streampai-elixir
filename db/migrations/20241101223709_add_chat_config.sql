-- migrate:up
CREATE TABLE IF NOT EXISTS
        chat_config (
                user_id UUID PRIMARY KEY REFERENCES users(id),
                config jsonb,
                updated_at timestamptz NOT NULL DEFAULT NOW()
        );

CREATE TRIGGER set_timestamp BEFORE
UPDATE ON chat_config FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp ();

-- migrate:down