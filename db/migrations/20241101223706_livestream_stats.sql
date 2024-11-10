-- migrate:up
CREATE TABLE IF NOT EXISTS
    livestream_stats (
        livestream_id UUID REFERENCES livestream (id) NOT NULL,
        created_at timestamptz DEFAULT NOW(),
        total_viewer_count INT DEFAULT 0,
        youtube_viewer_count INT DEFAULT 0,
        twitch_viewer_count INT DEFAULT 0
    );

-- migrate:down