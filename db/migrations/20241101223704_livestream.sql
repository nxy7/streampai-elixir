-- migrate:up
CREATE TABLE IF NOT EXISTS
    livestream (
        id UUID PRIMARY KEY,
        streamer_id UUID NOT NULL REFERENCES users(id),
        start_date TIMESTAMPTZ DEFAULT NOW(),
        end_date TIMESTAMPTZ
    );

-- migrate:down