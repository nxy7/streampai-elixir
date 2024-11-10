-- migrate:up
CREATE TABLE IF NOT EXISTS
        cloudflare_live_input (
                id TEXT,
                user_id UUID REFERENCES users(id) NOT NULL,
                stream_key TEXT UNIQUE NOT NULL,
                stream_url TEXT,
                updated_at timestamptz NOT NULL DEFAULT NOW(),
                PRIMARY KEY (id)
        );

CREATE TABLE IF NOT EXISTS
        cloudflare_live_output (
                id TEXT,
                live_input TEXT NOT NULL REFERENCES cloudflare_live_input (id),
                stream_key TEXT UNIQUE NOT NULL,
                stream_url TEXT NOT NULL,
                streaming_platform TEXT NOT NULL,
                updated_at timestamptz NOT NULL DEFAULT NOW(),
                PRIMARY KEY (id)
        );

CREATE TRIGGER set_timestamp BEFORE
UPDATE ON cloudflare_live_input FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp ();

CREATE TRIGGER set_timestamp BEFORE
UPDATE ON cloudflare_live_output FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp ();

-- migrate:down