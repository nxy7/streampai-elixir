-- migrate:up
CREATE TABLE IF NOT EXISTS
        poll (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
                user_id UUID REFERENCES users(id) NOT NULL,
                question TEXT NOT NULL,
                details jsonb,
                created_at timestamptz NOT NULL DEFAULT NOW()
        );

-- migrate:down