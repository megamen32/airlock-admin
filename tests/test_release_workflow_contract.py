"""Regression checks for release provenance gates in GitHub Actions."""

from pathlib import Path

import yaml


WORKFLOW = Path(__file__).resolve().parents[1] / ".github" / "workflows" / "build-and-sync.yml"


def test_release_job_verifies_provenance_before_publication() -> None:
    """Keep digest and installer-link checks ahead of any release upload."""

    workflow = yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))
    steps = workflow["jobs"]["build-and-release"]["steps"]
    names = [step.get("name", "") for step in steps]
    manifest_step = next(step for step in steps if step.get("name") == "Verify complete release provenance manifest")
    installer_step = next(step for step in steps if step.get("name") == "Verify installer links for shipped targets")

    assert names.index("Verify complete release provenance manifest") < names.index("Mirror source + tag + GitHub Release to public repo")
    assert "python3 tools/verify_release_manifest.py verify" in manifest_step["run"]
    assert "build/manifest.json" in manifest_step["run"]
    assert "build/gptadmin-sbom.spdx.json" in manifest_step["run"]
    assert "python3 tools/verify_installer_links.py" in installer_step["run"]
    assert "--target linux/amd64" in installer_step["run"]
    assert "--target darwin/arm64" in installer_step["run"]
    assert "--android" in installer_step["run"]

