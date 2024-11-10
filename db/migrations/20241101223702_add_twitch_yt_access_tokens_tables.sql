-- migrate:up
CREATE TABLE IF NOT EXISTS
    yt_tokens (
        user_id UUID PRIMARY KEY REFERENCES users(id),
        access_token TEXT NOT NULL,
        -- access_token_expiry timestamptz not null,
        refresh_token TEXT NOT NULL,
        --
        youtube_username TEXT,
        youtube_channel_url TEXT,
        youtube_avatar_url TEXT,
        -- 
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS
    twitch_tokens (
        user_id UUID PRIMARY KEY REFERENCES users(id),
        access_token TEXT NOT NULL,
        -- access_token_expiry timestamptz not null,
        refresh_token TEXT NOT NULL,
        -- 
        broadcaster_id TEXT,
        twitch_username TEXT,
        twitch_channel_url TEXT,
        twitch_avatar_url TEXT,
        -- 
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

CREATE TRIGGER set_timestamp BEFORE
UPDATE ON yt_tokens FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp ();

CREATE TRIGGER set_timestamp BEFORE
UPDATE ON twitch_tokens FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp ();

-- migrate:down