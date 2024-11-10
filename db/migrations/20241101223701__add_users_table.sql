-- migrate:up
CREATE TABLE IF NOT EXISTS
    users (
        -- primary user id
        id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID (),
        -- oauth uuids
        google_sub_id TEXT UNIQUE NOT NULL,
        -- 
        display_name TEXT NOT NULL,
        -- 
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS
    user_session (
        id TEXT PRIMARY KEY,
        expires_at TIMESTAMPTZ NOT NULL,
        user_id UUID NOT NULL REFERENCES users (id)
    );

CREATE TRIGGER set_timestamp BEFORE
UPDATE ON users FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp ();

-- migrate:down