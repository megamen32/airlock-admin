# Documentation links and build gate

Status: work

## User request

Find why the public documentation site links to the wrong site and every
documentation page returns 404. Add a build-time test that prevents a build
when a documentation link is incorrect or documentation routes return 404.

## Objective and business canary

The deployed documentation link opens the intended public site; every
documentation navigation target returns a non-404 success response. The website
build/CI fails locally before publication if either contract regresses.

## Scope and exclusions

Owned: website documentation routes, link generation/configuration, and a
focused build-time regression gate. Excluded: deployment, DNS/Nginx changes,
unrelated website redesign, and external documentation providers.

## Initial control limit

- Minimum / maximum active minutes: 15 / 35 (immutable initial range)
- Started at: 2026-08-11T22:37:35+03:00
- Lifecycle provenance: copied from committed todo before implementation after
  Worker research; scope unchanged
- Last task-file mtime observed: 2026-08-11T22:41:00+03:00

## Runtime identity

- Harness: Codex desktop
- PID: 1894973
- Agent session: unknown (harness did not expose a stable session id)
- PID status: alive during research
- Last PID signal: Worker returned research at 2026-08-11T22:41:00+03:00
- Last task-file transition: todo -> work at 2026-08-11T22:41:00+03:00

## Research evidence

- `website/src/components/site/footer.tsx` points documentation links to
  `https://bezrabotnyi.com`, while canonical GPTAdmin is
  `https://gptadmin.bezrabotnyi.com`.
- Documentation UI is hash-routed and fetches `/docs/{locale}/{slug}.md`.
  `website/scripts/sync-docs.mjs` mirrors manifest-selected root docs to both
  `src/content/docs` and `public/docs`.
- Existing `tests/test_site_docs.py` checks only mirror parity. Neither the
  website build nor CI checks the canonical footer link or every public docs
  asset route.

## Implementation contract

Add a focused build gate which reads the docs manifest and both locales,
validates the canonical footer target, and asserts every generated public docs
asset exists in build output. Wire it after documentation sync into the website
build script and existing CI docs job. Add a regression test that fails against
the prior incorrect footer URL/missing asset contract.

Acceptance: the targeted regression test and `website` build pass; a deliberate
bad canonical URL or absent docs asset makes the gate fail.
