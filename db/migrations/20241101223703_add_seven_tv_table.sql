-- migrate:up
CREATE TABLE IF NOT EXISTS
    seven_tv (
        user_id UUID PRIMARY KEY REFERENCES users(id),
        seven_tv_id TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

CREATE TRIGGER set_timestamp BEFORE
UPDATE ON seven_tv FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp ();

-- migrate:down