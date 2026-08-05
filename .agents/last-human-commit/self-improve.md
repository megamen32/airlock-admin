## 2026-08-04 — docs-custom-gpt-virtual-mcp-public-docs (Short)

- What slowed or confused L? `tests/test_product_auth_language.py` does not exist here, so I had to re-scope to real focused checks.
- Which instruction should change? none
- Which skill, MCP, or tool is missing? none
- What operation or error repeated? 1 failed combined pytest attempt because the missing test file short-circuited `&&`; a small existence check or direct known-test list would avoid it.
- State: fixed now

## 2026-08-05 — Root docs translation recovery (Short)

- What slowed or confused L? `englishFiles()` read a generated website mirror, so existing mirror-equality checks did not reveal that a new root document could not be translated first.
- Which instruction should change? none.
- Which skill, MCP, or tool is missing? Proposed: a docs-contract fixture helper that creates a stale mirror and root manifest without retained temporary diagnostics.
- What operation or error repeated? Two review passes preceded discovery that the first canary leaked its retained `/tmp/gptadmin-docs-*`; guard: require test-owned cleanup for diagnostic-mode fixtures.
- State: fixed now
