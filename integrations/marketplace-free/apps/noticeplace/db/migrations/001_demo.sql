-- +goose Up
CREATE TABLE demo_quota(id INTEGER PRIMARY KEY CHECK(id=1),hour TIMESTAMPTZ NOT NULL,used INTEGER NOT NULL CHECK(used BETWEEN 0 AND 6),total INTEGER NOT NULL CHECK(total BETWEEN 0 AND 100));
INSERT INTO demo_quota VALUES(1,date_trunc('hour',NOW()),0,0);
CREATE TABLE demo_requests(id UUID PRIMARY KEY,owner_id TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN ('dispatching','unknown','accepted')),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),accepted_at TIMESTAMPTZ,event_id TEXT NOT NULL DEFAULT '',incident_id TEXT NOT NULL DEFAULT '',CHECK((state='accepted')=(accepted_at IS NOT NULL)));
CREATE INDEX demo_requests_owner_idx ON demo_requests(owner_id,created_at DESC);
-- +goose Down
DROP TABLE demo_requests;
DROP TABLE demo_quota;
