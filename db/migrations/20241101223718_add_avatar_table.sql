-- migrate:up
CREATE TABLE IF NOT EXISTS
    avatar (
        user_id UUID REFERENCES users(id),
        file_id UUID REFERENCES file (file_id),
        updated_at timestamptz NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id),
        UNIQUE (user_id, file_id)
    );

CREATE TRIGGER set_timestamp BEFORE
UPDATE ON avatar FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp ();

-- migrate:down