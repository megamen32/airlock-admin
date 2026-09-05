from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_release_builder_packages_react_admin_as_runtime_static_payload():
    build = (ROOT / "tools" / "build.sh").read_text(encoding="utf-8")

    assert "npm run build -- --base=/admin/" in build
    assert '"$ART_DIR/public/admin"' in build
    assert "public/admin" in build


def test_cli_installs_packaged_admin_static_payload_with_hub_runtime():
    cli = (ROOT / "cli.py").read_text(encoding="utf-8")

    assert "public_src = tdp / 'public'" in cli
    assert "public_dst = INSTALL_DIR / 'public'" in cli
    assert "admin_src = public_src / 'admin'" in cli
    assert "shutil.copytree(admin_src" in cli
    assert "shutil.copy2(sibling, target)" in cli
    assert "continue" in cli


def test_cli_install_keeps_secret_input_page_alongside_admin():
    """The Hub /secret-input/{token} form must ship as part of every release."""

    cli = (ROOT / "cli.py").read_text(encoding="utf-8")
    assert "public_src.iterdir()" in cli
    assert "sibling.name in {'admin', 'admin-legacy'}" in cli

    page = (ROOT / "public" / "secret-input" / "index.html")
    assert page.exists(), "public/secret-input/index.html is missing from the repository"
    body = page.read_text(encoding="utf-8")
    assert 'name="value"' in body
    assert 'type="password"' in body


def test_old_admin_bookmarks_redirect_instead_of_shipping_a_second_application():
    html = (ROOT / "public" / "admin" / "index.html").read_text(encoding="utf-8")
    component = (ROOT / "admin-ui" / "src" / "OperationsScreen.tsx").read_text(encoding="utf-8")
    assert 'url=/admin/#overview' in html
    assert 'src="app.js"' not in html
    assert './operations/runtime.js' in component
    assert './operations/template.html?raw' in component
    assert 'iframe' not in component
