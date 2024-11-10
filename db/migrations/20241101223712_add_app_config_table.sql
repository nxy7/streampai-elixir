-- migrate:up
CREATE TABLE IF NOT EXISTS
    app_config (
        config_key TEXT PRIMARY KEY,
        config_value jsonb,
        updated_at timestamptz NOT NULL DEFAULT NOW()
    );

CREATE TRIGGER set_timestamp BEFORE
UPDATE ON app_config FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp ();

-- migrate:down