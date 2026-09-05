"""Exercise the built admin against an isolated real Go Hub, never production."""
import json
import socket
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    artifacts = root / '.tmp/unified-admin-ui'
    artifacts.mkdir(parents=True, exist_ok=True)
    subprocess.run(['go', 'build', '-o', str(artifacts / 'ui-canary'), './internal/hub/testdata/admin-canary'], cwd=root / 'go-hub', check=True, timeout=120)
    fixture = Path(tempfile.mkdtemp(prefix='browser-fixture-', dir=artifacts))
    (fixture / 'public').mkdir()
    (fixture / 'public/admin').symlink_to(root / 'admin-ui/dist', target_is_directory=True)
    (fixture / 'fixture.env').write_text('SHELLMCP_HEARTBEAT=0\n')
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        address = f'127.0.0.1:{sock.getsockname()[1]}'
    url = 'http://' + address
    log = (artifacts / 'browser-canary.log').open('w')
    server = subprocess.Popen([str(artifacts / 'ui-canary'), str(fixture), address], stdout=log, stderr=log)
    errors = []
    try:
        for _ in range(100):
            try:
                urllib.request.urlopen(url + '/admin/', timeout=1).close()
                break
            except Exception:
                if server.poll() is not None:
                    raise RuntimeError('Canary exited before becoming ready')
                time.sleep(0.1)
        else:
            raise RuntimeError('Canary startup timeout')
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width': 1440, 'height': 1000})
            page.set_default_timeout(5000)
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(url + '/admin/')
            page.locator('input[name="password"]').fill('local-ui-canary')
            page.locator('input[name="password"]').press('Enter')
            page.locator('#view-overview.active').wait_for()
            page.locator('#status').filter(has_text='online').wait_for()
            assert page.locator('iframe').count() == 0
            page.screenshot(path=str(artifacts / 'unified-desktop.png'), full_page=True)
            with page.expect_response(lambda response: '/admin/api/overview' in response.url):
                page.locator('.operations-console .topbar button[onclick="refreshAll()"]').click()
            routes = [
                ('Серверы', 'agents'), ('Задачи', 'jobs'), ('MCP-менеджер', 'mcpmanage'),
                ('Вызов инструментов', 'tools'), ('Ресурсы', 'resources'),
                ('Резервирование', 'failover'), ('Аудит', 'audit'),
                ('Инструкции', 'instructions'), ('Профили', 'profiles'),
                ('Вебхуки и агенты', 'webhooks'), ('Виртуальные MCP', 'capabilities'),
                ('Безопасность · opt-in', 'security'), ('Клиенты', 'clients'),
            ]
            for label, route in routes:
                page.get_by_role('link', name=label, exact=True).click()
                page.wait_for_url('**/#' + route)
                page.wait_for_timeout(100)
            page.get_by_role('button', name='Выдать managed token', exact=True).click()
            page.locator('.token-callout code').wait_for()
            issued = page.locator('.token-callout code').inner_text()
            assert issued.startswith('gptk_')
            page.get_by_role('link', name='Токены и подключение', exact=True).click()
            assert page.get_by_label('Выданный токен подключения').input_value() == issued
            page.get_by_role('link', name='Клиенты', exact=True).click()
            assert page.locator('.token-callout code').inner_text() == issued
            page.goto(url + '/admin/legacy/')
            page.wait_for_url('**/admin/#overview')
            page.locator('#status').filter(has_text='online').wait_for()
            page.set_viewport_size({'width': 390, 'height': 844})
            page.screenshot(path=str(artifacts / 'unified-mobile.png'), full_page=True)
            dimensions = page.evaluate('({width:innerWidth, content:document.documentElement.scrollWidth})')
            assert dimensions['content'] <= dimensions['width'] + 2, dimensions
            assert not errors, errors
            browser.close()
        print(json.dumps({'result': 'PASS', 'routes': len(routes), 'real_go_hub': True, 'token_retained_on_navigation': True, 'legacy_redirect': True, 'mobile': dimensions, 'page_errors': errors}, ensure_ascii=False))
    finally:
        server.terminate()
        try:
            server.wait(timeout=10)
        except subprocess.TimeoutExpired:
            server.kill()
            server.wait()
        log.close()


if __name__ == "__main__":
    main()
