from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parent.parent
DOCS_ROOT = ROOT / "docs"
WEBSITE_SOURCE = ROOT / "website" / "src" / "content" / "docs"
WEBSITE_PUBLIC = ROOT / "website" / "public" / "docs"

# The website/ is a private git submodule that CI does not check out (it has no
# token with cross-repo access). Run these guards only where its rendered-doc
# source is present (developer machines, the opensource mirror, etc.).
pytestmark = pytest.mark.skipif(
    not WEBSITE_SOURCE.exists(),
    reason="website submodule not checked out",
)


def _site_docs_text() -> str:
    """Return all source documents displayed by the website docs page."""
    return "\n".join(path.read_text() for path in WEBSITE_SOURCE.rglob("*.md"))


def _published_docs() -> list[str]:
    return sorted(path.name for path in (WEBSITE_SOURCE / "en").glob("*.md"))


def _source_path(locale: str, filename: str) -> Path:
    return DOCS_ROOT / filename if locale == "en" else DOCS_ROOT / locale / filename


def _mirror_path(root: Path, locale: str, filename: str) -> Path:
    return root / locale / filename


def _assert_mirror(root: Path) -> None:
    published = _published_docs()
    for locale in ("en", "ru", "cn"):
        mirror_files = sorted(path.name for path in (root / locale).glob("*.md"))
        assert mirror_files == published
        for filename in published:
            assert _mirror_path(root, locale, filename).read_text() == _source_path(locale, filename).read_text()


def test_site_docs_cover_live_action_and_oauth_contract():
    docs_text = _site_docs_text()
    assert "https://<your-hub>/actions/openapi.yaml" in docs_text
    assert "/oauth/authorize" in docs_text
    assert "/oauth/token" in docs_text
    assert "gptadmin.read gptadmin.exec" in docs_text


def test_site_docs_do_not_publish_owner_hub_url():
    assert "u-f1102930.t.gptadmin.bezrabotnyi.com" not in _site_docs_text()


def test_site_docs_mirror_root_source_and_public_tree():
    _assert_mirror(WEBSITE_SOURCE)
    _assert_mirror(WEBSITE_PUBLIC)
