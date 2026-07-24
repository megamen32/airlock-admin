"""Contract checks for canonical product documentation and local links."""

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOC_SOURCES = [ROOT / "README.md", *sorted((ROOT / "docs").glob("*.md"))]
LINK_RE = re.compile(r"\]\(([^)]+)\)")


def test_documentation_map_names_one_canonical_page_per_supported_surface() -> None:
    """Every supported path needs a maintained entry point and changelog link."""

    document = (ROOT / "docs" / "DOCUMENTATION_MAP.md").read_text(encoding="utf-8").lower()
    for required in (
        "getting started",
        "mcp clients",
        "browser extension",
        "chatgpt custom gpt",
        "profiles",
        "network proxy",
        "security",
        "deployment blueprints",
        "live acceptance",
        "canary acceptance",
        "changelog.md",
    ):
        assert required in document, f"documentation map is missing {required!r}"


def test_local_markdown_links_resolve() -> None:
    """Docs CI must catch links that point at files removed from the repository."""

    broken: list[str] = []
    for source in DOC_SOURCES:
        for target in LINK_RE.findall(source.read_text(encoding="utf-8")):
            target = target.strip().strip("<>").split("#", 1)[0].split("?", 1)[0]
            if not target or target.startswith(("http://", "https://", "mailto:", "#")):
                continue
            candidate = (source.parent / target).resolve()
            if not candidate.exists():
                broken.append(f"{source.relative_to(ROOT)} -> {target}")
    assert not broken, "broken local documentation links:\n" + "\n".join(broken)


def test_release_workflow_runs_docs_contract() -> None:
    """The release workflow must execute the docs contract, not only build artifacts."""

    workflow = (ROOT / ".github" / "workflows" / "build-and-sync.yml").read_text(encoding="utf-8")
    assert "name: Docs product contract" in workflow
    assert "python3 -m pytest tests/test_docs_product_contract.py tests/test_feedback_loop_contract.py -q" in workflow


def test_integration_control_contract_matches_current_hub_scope() -> None:
    """Integration docs must not downgrade implemented discover/schema/execute flow."""

    document = (ROOT / "docs" / "INTEGRATION_CONTROL_CONTRACT.md").read_text(encoding="utf-8").lower()
    assert "current hub implementation" in document
    assert "discover -> schema -> execute" in document
    assert "schema version/digest" in document
    assert "no implementation is being claimed" not in document
