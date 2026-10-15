-- +goose Up
CREATE TABLE demo_jobs(user_id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, template TEXT NOT NULL, state TEXT NOT NULL, session_id TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
-- +goose Down
DROP TABLE demo_jobs;
