-- migrate:up
CREATE TABLE IF NOT EXISTS
        chat_message (
                id TEXT NOT NULL,
                livestream_id UUID REFERENCES livestream (id),
                author_name TEXT NOT NULL,
                author_id TEXT NOT NULL,
                author_is_patreon BOOLEAN DEFAULT FALSE NOT NULL,
                platform TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at timestamptz DEFAULT NOW() NOT NULL
        );

-- migrate:down