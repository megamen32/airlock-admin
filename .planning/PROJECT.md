# Airlock instance operations

## What This Is
Wrapper for operating separate Airlock instances and thin adapters. Existing private Airlock on100 remains owned by its existing operators. This task delivers a public demo on88 with passwordless guest entry.

## Core Value
Visitor opens real Airlock without a password, chats with startups, creates a project, and cannot edit/delete projects or administer the platform.

## Requirements
### Validated
- ✓ Existing private native Airlock Docker instance runs on100; source and foreign WIP preserved.
### Active
- [x] Isolated bounded demo88 with fresh database/storage/credentials.
- [x] Passwordless distinct ordinary users; brokered create only; edit/delete denied.
- [x] Public HTTPS and real browser+backend permission canaries.
### Out of Scope
- Private instance/data migration; modifying Airlock core; registering Oleg DNS without access.
- Paid marketplace subscriptions, personal account data in public demo, or modifying Airlock core.

## Context
Canonical wrapper has foreign WIP and existing nonmain branch; never switch/reset it. User selected88 after creator ruled out2GB/10GB VPS. Public demo.airlockrun.ru DNS and VPS Caddy route are live; official Internal RU frontend is selected.

## Constraints
- Source: official v0.7.0 images/archive and thin external adapters.
- Isolation: dedicated demo state, ordinary user sessions, bounded resources, no existing Docker/project changes.
- Delivery: owned source only; public consumer proof is mandatory.

## Key Decisions
| Decision | Rationale | Outcome |
|---|---|---|
| server88 | ~94GB RAM/124GB disk available;32GB host reserve | Pending |
| Own temporary hostname | Oleg owns airlockrun.ru DNS;user defers it | Pending |
| Thin guest/create gateway | Native user lacks create and permits some edits; explicit custom permission requested | Pending |

*Last updated:2026-10-14 after direct demo request*

## Marketplace assignment14Oct2026
User supplied37cardcatalog; preserve thin wrapper/nativeapps and connect free APIs.
DaData/Shtab real user surface accepted. Priceva requires correct campaign type;
user authorized using actual M1Chrome profile and provided required account input.
Source/instructions:.agents/tasks/airlock-marketplace-free-20261014.md
