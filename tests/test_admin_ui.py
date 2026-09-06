from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def test_authenticated_admin_page_has_no_topbar_password_field():
    html = (ROOT / "admin-ui" / "src" / "operations" / "template.html").read_text()
    assert 'id="token"' not in html
    assert 'placeholder="optional CTL_TOKEN"' not in html


def test_react_admin_explains_the_current_mcp_auth_choice():
    app = (ROOT / "admin-ui" / "src" / "App.tsx").read_text()
    assert "Авторизация" in app
    assert "Токены подключения и управление OAuth" in app
    assert "Выдать managed token" in app


def test_react_admin_uses_user_facing_auth_labels():
    app = (ROOT / "admin-ui" / "src" / "App.tsx").read_text()
    assert "OAuth secret" in app
    assert "Выдать managed token" in app
    assert "Режим доступа" in app


def test_react_admin_offers_managed_token_issue_and_rotation_for_non_oauth_clients():
    """Clients without OAuth keep an explicit managed-token fallback path."""
    app = (ROOT / "admin-ui" / "src" / "App.tsx").read_text()
    api = (ROOT / "admin-ui" / "src" / "api.ts").read_text()
    assert "Выдать managed token" in app
    assert "Режим доступа" in app
    assert '<option value="readonly">Только чтение</option>' in app
    assert "issueMcpToken" in api
    assert "rotateMcpToken" in api
    assert "/admin/api/mcp/issue-token" in api
    assert "/admin/api/mcp/tokens/" in api


def test_admin_oauth_rotation_uses_hub_endpoint_without_client_side_secret_generation():
    api = (ROOT / "admin-ui" / "src" / "api.ts").read_text()
    app = (ROOT / "admin-ui" / "src" / "App.tsx").read_text()
    assert "/admin/api/auth/rotate-oauth" in api
    assert "export async function rotateOAuth" in api
    assert "crypto.getRandomValues" not in api
    assert "Ротировать OAuth secret" in app


def test_admin_ui_does_not_offer_legacy_ctl_bearer_controls():
    html = (ROOT / "admin-ui" / "src" / "operations" / "template.html").read_text()
    script = (ROOT / "admin-ui" / "src" / "operations" / "runtime.js").read_text()
    assert "CTL_TOKEN" not in html
    assert "CTL_TOKEN" not in script


def test_admin_security_controls_use_typed_hub_endpoints_without_shell_env_mutation():
    html = (ROOT / "admin-ui" / "src" / "operations" / "template.html").read_text()
    script = (ROOT / "admin-ui" / "src" / "operations" / "runtime.js").read_text()
    security_start = script.index("// ===== Security management =====")
    security = script[security_start:]
    for internal_name in ("MCP_BRIDGE_KEY", "OAUTH_CLIENT_SECRET", "SHELLMCP_TOKEN", "CTL_TOKEN"):
        assert internal_name not in html
        assert internal_name not in security
    assert "setEnvVar" not in html
    assert "shell_exec" not in security
    for endpoint in (
        "/admin/api/security/preset",
        "/admin/api/security/reauth",
        "/admin/api/security/mfa/totp/enroll",
        "/admin/api/security/mfa/totp/verify",
        "/admin/api/telemetry",
        "/admin/api/approvals",
    ):
        assert endpoint in security
    assert "function ensureSecurityReauth" in security


def test_admin_security_ui_offers_passkey_enrollment_without_raw_credentials():
    """The shipped admin SPA must expose the backend WebAuthn enrollment flow."""

    html = (ROOT / "admin-ui" / "src" / "operations" / "template.html").read_text(encoding="utf-8")
    script = (ROOT / "admin-ui" / "src" / "operations" / "runtime.js").read_text(encoding="utf-8")
    security_start = script.index("// ===== Security management =====")
    security = script[security_start:]
    assert "Зарегистрировать passkey" in html
    assert "securityPasskeyResult" in html
    assert "/admin/api/security/mfa/webauthn/register/begin" in security
    assert "/admin/api/security/mfa/webauthn/register/finish" in security
    assert "navigator.credentials.create" in security
    assert "CTL_TOKEN" not in security


def test_react_admin_manages_optional_virtual_mcps_through_the_typed_endpoint():
    react_api = (ROOT / "admin-ui" / "src" / "api.ts").read_text(encoding="utf-8")
    react_app = (ROOT / "admin-ui" / "src" / "App.tsx").read_text(encoding="utf-8")

    assert "getVirtualMCPs" in react_api and "setVirtualMCP" in react_api
    assert "/admin/api/virtual-mcps" in react_api
    assert "Виртуальные MCP" in react_app
