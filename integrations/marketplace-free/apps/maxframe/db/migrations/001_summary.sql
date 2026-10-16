-- +goose Up
CREATE TABLE summary_cache(cache_key TEXT PRIMARY KEY,payload JSONB NOT NULL,fetched_at TIMESTAMPTZ NOT NULL);
CREATE TABLE summary_quota(hour TIMESTAMPTZ PRIMARY KEY,used INTEGER NOT NULL CHECK(used BETWEEN 1 AND 12));
-- +goose Down
DROP TABLE summary_quota;
DROP TABLE summary_cache;
