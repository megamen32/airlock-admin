-- +goose Up
CREATE TABLE demo_settings(id INTEGER PRIMARY KEY CHECK(id=1),tester_id TEXT NOT NULL DEFAULT '' CHECK(tester_id='' OR tester_id~'^[a-f0-9]{24}$'));
INSERT INTO demo_settings VALUES(1,'');
CREATE TABLE demo_quota(id INTEGER PRIMARY KEY CHECK(id=1),hour TIMESTAMPTZ NOT NULL,used INTEGER NOT NULL CHECK(used BETWEEN 0 AND 6),total INTEGER NOT NULL CHECK(total BETWEEN 0 AND 100));
INSERT INTO demo_quota VALUES(1,date_trunc('hour',NOW()),0,0);
CREATE TABLE demo_runs(id UUID PRIMARY KEY,owner_id TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN ('dispatching','accepted','unknown','rejected','complete')),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),completed_at TIMESTAMPTZ,CHECK((state='complete')=(completed_at IS NOT NULL)));
CREATE INDEX demo_runs_owner_idx ON demo_runs(owner_id,created_at DESC);
-- +goose Down
DROP TABLE demo_runs;
DROP TABLE demo_quota;
DROP TABLE demo_settings;
