-- migrate:up
CREATE TABLE IF NOT EXISTS
    stream_settings (
        user_id UUID PRIMARY KEY REFERENCES users(id),
        stream_title TEXT,
        stream_description TEXT,
        stream_category TEXT,
        thumbnail_file UUID REFERENCES file (file_id),
        updated_at timestamptz NOT NULL DEFAULT NOW()
    );

CREATE TRIGGER set_timestamp BEFORE
UPDATE ON stream_settings FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp ();

-- migrate:down