"""Behavioral regressions for the immutable tag-build contract."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def _minimal_build_repo(tmp_path: Path) -> Path:
    """Create the smallest real build-script checkout needed for the CLI target."""

    repo = tmp_path / "release-build"
    (repo / "tools").mkdir(parents=True)
    shutil.copy2(REPO_ROOT / "tools" / "build.sh", repo / "tools" / "build.sh")
    shutil.copy2(REPO_ROOT / "tools" / "generate_sbom.py", repo / "tools" / "generate_sbom.py")
    shutil.copy2(REPO_ROOT / "tools" / "verify_release_manifest.py", repo / "tools" / "verify_release_manifest.py")
    shutil.copy2(REPO_ROOT / "cli.py", repo / "cli.py")
    (repo / "VERSION").write_text("129\n", encoding="utf-8")
    subprocess.run(["git", "init"], cwd=repo, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.email", "release-test@example.invalid"], cwd=repo, check=True)
    subprocess.run(["git", "config", "user.name", "Release Test"], cwd=repo, check=True)
    subprocess.run(["git", "add", "."], cwd=repo, check=True)
    subprocess.run(["git", "commit", "-m", "release fixture"], cwd=repo, check=True, capture_output=True, text=True)
    subprocess.run(["git", "tag", "v129"], cwd=repo, check=True)
    return repo


def _run_tagged_cli_build(repo: Path, tag: str) -> subprocess.CompletedProcess[str]:
    """Run the real CLI build path with the proposed immutable release inputs."""

    environment = os.environ | {"TAGGED_RELEASE": "1", "RELEASE_TAG": tag, "SKIP_TESTS": "1"}
    return subprocess.run(
        ["bash", "tools/build.sh", "cli"],
        cwd=repo,
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )


def test_tagged_build_keeps_version_and_generates_matching_metadata(tmp_path: Path) -> None:
    """A v129 tag must package v129 without rewriting the tracked version."""

    repo = _minimal_build_repo(tmp_path)
    completed = _run_tagged_cli_build(repo, "v129")

    assert completed.returncode == 0, completed.stderr
    assert (repo / "VERSION").read_text(encoding="utf-8") == "129\n"
    build_info = (repo / "client" / "gptadmin_build_info.py").read_text(encoding="utf-8")
    assert "BUILD_VERSION = 129" in build_info
    commit = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=repo, check=True, capture_output=True, text=True).stdout.strip()
    assert f'GIT_COMMIT = "{commit}"' in build_info
    assert (repo / "gptadmin_build_info.py").read_text(encoding="utf-8") == build_info
    manifest = json.loads((repo / "build" / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["build_version"] == 129
    assert manifest["git_commit"] == commit


def test_tagged_build_rejects_tag_version_mismatch(tmp_path: Path) -> None:
    """A mismatched tag must fail before building an incorrectly labelled artifact."""

    completed = _run_tagged_cli_build(_minimal_build_repo(tmp_path), "v130")

    assert completed.returncode != 0
    assert "RELEASE_TAG must equal v129" in completed.stdout + completed.stderr


def test_tagged_build_requires_existing_tag_at_head(tmp_path: Path) -> None:
    """A tag build must not emit provenance when its declared tag is absent."""

    repo = _minimal_build_repo(tmp_path)
    subprocess.run(["git", "tag", "-d", "v129"], cwd=repo, check=True, capture_output=True, text=True)
    completed = _run_tagged_cli_build(repo, "v129")

    assert completed.returncode != 0
    assert "RELEASE_TAG v129 does not resolve to HEAD" in completed.stdout + completed.stderr


def test_tagged_build_rejects_tag_that_is_not_head(tmp_path: Path) -> None:
    """A tag from an earlier commit cannot label artifacts from a newer HEAD."""

    repo = _minimal_build_repo(tmp_path)
    (repo / "release-note.txt").write_text("new head\n", encoding="utf-8")
    subprocess.run(["git", "add", "release-note.txt"], cwd=repo, check=True)
    subprocess.run(["git", "commit", "-m", "new head"], cwd=repo, check=True, capture_output=True, text=True)
    completed = _run_tagged_cli_build(repo, "v129")

    assert completed.returncode != 0
    assert "RELEASE_TAG v129 does not resolve to HEAD" in completed.stdout + completed.stderr


def test_tagged_build_rejects_non_numeric_version(tmp_path: Path) -> None:
    """Tag builds reject malformed version files instead of normalizing them."""

    repo = _minimal_build_repo(tmp_path)
    (repo / "VERSION").write_text("129oops\n", encoding="utf-8")
    completed = _run_tagged_cli_build(repo, "v129")

    assert completed.returncode != 0
    assert "VERSION must contain a plain integer" in completed.stdout + completed.stderr
