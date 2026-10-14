-- +goose Up
CREATE TABLE lookup_quota(day DATE PRIMARY KEY, used INTEGER NOT NULL CHECK(used BETWEEN 1 AND 1000));
CREATE TABLE lookup_cache(query TEXT PRIMARY KEY, result JSONB NOT NULL, fetched_at TIMESTAMPTZ NOT NULL);
-- +goose Down
DROP TABLE lookup_cache;
DROP TABLE lookup_quota;
