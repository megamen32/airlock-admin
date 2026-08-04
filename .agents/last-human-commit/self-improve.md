## 2026-08-04 — docs-custom-gpt-virtual-mcp-public-docs (Short)

- What slowed or confused L? `tests/test_product_auth_language.py` does not exist here, so I had to re-scope to real focused checks.
- Which instruction should change? none
- Which skill, MCP, or tool is missing? none
- What operation or error repeated? 1 failed combined pytest attempt because the missing test file short-circuited `&&`; a small existence check or direct known-test list would avoid it.
- State: fixed now
