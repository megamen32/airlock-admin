-- +goose Up
CREATE TABLE demo_quota(id INTEGER PRIMARY KEY CHECK(id=1),hour TIMESTAMPTZ NOT NULL,used INTEGER NOT NULL CHECK(used BETWEEN 0 AND 4),total INTEGER NOT NULL CHECK(total BETWEEN 0 AND 20));
INSERT INTO demo_quota VALUES(1,date_trunc('hour',NOW()),0,0);
CREATE TABLE demo_runs(id UUID PRIMARY KEY,owner_id TEXT NOT NULL UNIQUE,state TEXT NOT NULL CHECK(state IN ('dispatching','accepted','unknown','complete')),question TEXT NOT NULL,answer TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),completed_at TIMESTAMPTZ,CHECK((state='complete')=(completed_at IS NOT NULL)),CHECK((state='complete')=(answer<>'')));
-- +goose Down
DROP TABLE demo_runs;
DROP TABLE demo_quota;
