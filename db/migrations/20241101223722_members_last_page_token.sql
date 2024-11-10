-- migrate:up
CREATE TABLE IF NOT EXISTS
        yt_members_page_token (
                user_id UUID PRIMARY KEY REFERENCES users(id),
                token TEXT NOT NULL,
                updated_at timestamptz NOT NULL DEFAULT NOW()
        );

CREATE TRIGGER set_timestamp BEFORE
UPDATE ON yt_members_page_token FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp ();

-- migrate:down