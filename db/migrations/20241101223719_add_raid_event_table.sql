-- migrate:up
CREATE TABLE IF NOT EXISTS
        raid (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
                user_id UUID REFERENCES users(id) NOT NULL,
                platform TEXT NOT NULL,
                viewers_amount INTEGER NOT NULL,
                created_at timestamptz NOT NULL DEFAULT NOW()
        );

-- migrate:down