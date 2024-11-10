-- migrate:up
CREATE TABLE IF NOT EXISTS
        donation_goal (
                goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
                user_id UUID REFERENCES users(id) NOT NULL,
                NAME TEXT NOT NULL,
                goal REAL NOT NULL,
                start_amount REAL NOT NULL DEFAULT 0,
                start_date timestamptz NOT NULL,
                updated_at timestamptz NOT NULL DEFAULT NOW()
        );

-- migrate:down