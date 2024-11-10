-- migrate:up
CREATE TABLE IF NOT EXISTS
        webhook (
                webhook_id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id) NOT NULL,
                webhook_url TEXT NOT NULL,
                updated_at timestamptz NOT NULL DEFAULT NOW()
        );

CREATE TRIGGER set_timestamp BEFORE
UPDATE ON webhook FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp ();

-- migrate:down