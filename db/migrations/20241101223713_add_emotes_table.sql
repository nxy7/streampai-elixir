-- migrate:up
CREATE TYPE emote_source AS ENUM('seventv', 'youtube', 'twitch');

CREATE TABLE IF NOT EXISTS
        emote (
                user_id UUID REFERENCES users(id),
                emote_name TEXT,
                emote_path TEXT NOT NULL,
                source emote_source NOT NULL,
                updated_at timestamptz NOT NULL DEFAULT NOW(),
                PRIMARY KEY (user_id, emote_name)
        );

-- migrate:down