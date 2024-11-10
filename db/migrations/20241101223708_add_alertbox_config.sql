-- migrate:up
CREATE TABLE IF NOT EXISTS
    alertbox_config (
        user_id UUID PRIMARY KEY REFERENCES users(id),
        config jsonb DEFAULT NULL,
        updated_at timestamptz NOT NULL DEFAULT NOW()
    );

CREATE TRIGGER set_timestamp BEFORE
UPDATE ON alertbox_config FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp ();

-- migrate:down