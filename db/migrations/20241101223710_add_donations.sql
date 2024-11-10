-- migrate:up
CREATE TABLE IF NOT EXISTS
    donation (
        donation_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id UUID NOT NULL REFERENCES users(id),
        -- donation status is used to signal if donation just started, if it was
        -- processed or even revoked
        donation_status INT NOT NULL DEFAULT 1,
        donor_name TEXT NOT NULL,
        donor_email TEXT NOT NULL,
        donation_message TEXT,
        currency TEXT NOT NULL DEFAULT 'pln',
        amount FLOAT NOT NULL CHECK (amount > 0),
        payment_method TEXT,
        created_at timestamptz NOT NULL DEFAULT NOW()
    );

-- migrate:down