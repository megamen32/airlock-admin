# Roadmap: Airlock public demo

## Phases
- [x] **Phase 1: Separate demo runtime** — official Airlock on88 with measured finite budgets and fresh state.
- [x] **Phase 2: Guest creation and public acceptance** — passwordless ordinary users, protected projects, HTTPS, real consumer canaries.

## Phase Details
### Phase 1: Separate demo runtime
**Goal**:Separate Airlock works without touching private production.
**Requirements**:DEP-01
**Success Criteria**:
1. Actual Docker runtime and persistent isolated state on88.
2. Native budgets and current host reserve proven.
**Plans**: .agents/tasks/airlock-demo-20261014.md
### Phase 2: Guest creation and public acceptance
**Goal**:Real public guest business journey and denied project modifications.
**Depends on**:Phase1
**Requirements**:AUTH-01,CAP-01,CAP-02,WEB-01
**Success Criteria**:
1. Headed new browser enters without credentials and creates a project.
2. Real chat and API-denied edit/delete/admin with preserved project data.
**Plans**: .agents/tasks/airlock-demo-20261014.md

## Progress
| Phase | Status | Completed |
|---|---|---|
|1.Runtime|Complete|2026-10-14|
|2.Guests and acceptance|Complete|2026-10-14|

## Marketplace follow-up
- [ ] **Phase 3: Free native integrations** — classification37, separate upstream delta, DaData/Shtab/Priceva.
### Phase 3: Free native integrations
**Goal**:Real free integrations on unchanged Russian Internal demo.
**Requirements**:UPD-01,INT-01,INT-02,INT-03
**Plans**:.agents/tasks/airlock-marketplace-free-20261014.md
**Progress**:DaData/Shtab accepted, Priceva real campaign setup in progress.
