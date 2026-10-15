-- +goose Up
CREATE TABLE summary_cache(id INTEGER PRIMARY KEY CHECK(id=1),payload JSONB NOT NULL,fetched_at TIMESTAMPTZ NOT NULL);
CREATE TABLE demo_quota(id INTEGER PRIMARY KEY CHECK(id=1),hour TIMESTAMPTZ NOT NULL,used INTEGER NOT NULL CHECK(used BETWEEN 0 AND 12));
INSERT INTO demo_quota VALUES(1,date_trunc('hour',NOW()),0);
-- +goose Down
DROP TABLE demo_quota;
DROP TABLE summary_cache;
