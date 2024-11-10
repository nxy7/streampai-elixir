-- migrate:up
CREATE TABLE IF NOT EXISTS
        payout (
                payout_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
                user_id UUID NOT NULL REFERENCES users(id),
                status INT NOT NULL DEFAULT 1 CHECK (status > 0),
                amount FLOAT NOT NULL CHECK (amount > 0),
                currency TEXT NOT NULL DEFAULT 'pln',
                created_at timestamptz NOT NULL DEFAULT NOW()
        );

-- migrate:down