-- migrate:up
SELECT
    create_hypertable ('livestream_stats', by_range ('created_at'));

SELECT
    create_hypertable ('chat_message', by_range ('created_at'));

SELECT
    create_hypertable ('livestream_event', by_range ('created_at'));

-- migrate:down