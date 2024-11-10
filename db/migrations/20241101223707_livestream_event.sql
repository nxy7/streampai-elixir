-- migrate:up
CREATE TABLE IF NOT EXISTS
    livestream_event (
        event_id UUID DEFAULT gen_random_uuid () NOT NULL,
        livestream_id UUID,
        streamer_id UUID NOT NULL,
        created_at timestamptz DEFAULT NOW() NOT NULL,
        event_type TEXT NOT NULL,
        details jsonb NOT NULL
    );

-- migrate:down