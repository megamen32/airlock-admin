---
phase: quick-261016-mrr
plan: 01
type: execute
autonomous: true
---
# Upgrade both named Airlock installations

Direct user16Oct: update airlock.bezrabotnyi.com and demo.airlockrun.ru to latest
Airlock Internal. Main100/Demo88; preserve databases,S3,credentials,activation,
app source/receipts,memberships,RU UI and external thin demo gateway.
No core fork, unrelated WIP reset, new checkout or worktree.

1.Verify published tag/image vs live state, current upgrade/migration contract.
2.Snapshot live deployment and backup before any runtime mutation; select paired
   components, publish owned deployment source, stage images within real budgets.
3.Update demo first, run actual guest form/chat + permissions/RU check; update
   private installation and verify actual authenticated native consumer.
4.Record source/runtime/consumer results separately and preserve rollback.

Current discovery: latest tagged Internalv0.7.0/690a90e already on both.
main0f023c8 is newer/unreleased; CI failure. Human version-selection question
pending; do not equate published release with untagged source HEAD.

No heavy build admitted yet.100free29GiB/328GiBdisk,88free82GiB/29GiBdemoFS.
Existing sealed runtime budgets retained. Before build/dump choose finite
RAM/swap/CPU/tasks/temp/wall limits from measured load and documented runbook.


Resolved16Oct: human explicitly instructs source update and Oleg conversation
read. Version target is current committed Internal main, not release-only. Verify
compatible module revisions from HQ before build and schema migration. Parallel
independent root work: refresh canonical provider correspondence dashboard.

16Oct checkpoint: all five paired source images built, no live switch. Real
demo dump/source snapshot + isolated S3 bucket migrated by original helper to013
in16s;20apps/64source revisions/64packs. First stage CREATE-privilege defect
fixed only on clone, original grants copied; no live permissions changed.
Private100 legacy ledger12–16 rejected by original migration guard and real
S3 inventory503 is intentional missing-object recovery behavior. Next delivery
step is paired-image registry support, current backup/cutover, actual demo SDK
rebuild and guest acceptance; private migration requires its specific data
reconciliation. Current vendor dashboard published, user chose cached Telegram
reads without waiting for reauthentication. No new vendor sends/payments.
