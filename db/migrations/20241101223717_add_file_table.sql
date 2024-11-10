-- migrate:up
CREATE TABLE IF NOT EXISTS
    file (
        file_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        filepath TEXT NOT NULL,
        bucket_name TEXT NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        filesize INT NOT NULL,
        UNIQUE (filepath, bucket_name, user_id)
    );

-- migrate:down