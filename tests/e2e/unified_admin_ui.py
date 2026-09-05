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
                ('Резервирование', 'failover'), ('Аудит', 'audit'), ('Операции доступа', 'operations'),
                ('Инструкции', 'instructions'), ('Профили', 'profiles'),
                ('Вебхуки и агенты', 'webhooks'), ('Виртуальные MCP', 'capabilities'),
                ('Безопасность · opt-in', 'security'), ('Клиенты', 'clients'),
            ]
            for label, route in routes:
                page.get_by_role('link', name=label, exact=True).click()
                page.wait_for_url('**/#' + route)
                page.wait_for_timeout(100)
            page.get_by_role('link', name='Профили', exact=True).click()
            page.get_by_role('button', name='Новый профиль', exact=True).click()
            page.get_by_label('Идентификатор профиля', exact=True).fill('browser-ops')
            page.get_by_label('Название профиля', exact=True).fill('Browser operations')
            page.get_by_label('Режим доступа', exact=True).select_option('full')
            page.get_by_label('Режим выполнения', exact=True).select_option('unrestricted')
            page.get_by_label('Разрешённые цели', exact=True).fill('*')
            page.get_by_label('Разрешённые инструменты', exact=True).fill('*')
            with page.expect_response(lambda response: response.url.endswith('/admin/api/access-profiles/browser-ops') and response.request.method == 'PUT') as created:
                page.get_by_role('button', name='Создать профиль', exact=True).click()
            assert created.value.status == 200, created.value.text()[:1000]
            page.get_by_label('Название профиля', exact=True).wait_for()
            profile = page.request.get(url + '/admin/api/access-profiles/browser-ops').json()
            assert profile['approval_mode'] == 'unrestricted'
            assert not profile['workspace_refs']
            page.get_by_role('button', name='Добавить рабочее пространство', exact=True).click()
            page.get_by_label('Рабочее пространство 1: machine id', exact=True).fill('fixture')
            page.get_by_label('Рабочее пространство 1: путь', exact=True).fill('/work')
            page.get_by_label('Рабочее пространство 1: startup document', exact=True).fill('AGENTS.md')
            page.get_by_label('Рабочее пространство 1: shell target', exact=True).fill('shell:fixture')
            page.get_by_role('button', name='Сохранить профиль', exact=True).click()
            page.get_by_text('Профиль сохранён', exact=True).wait_for()
            page.reload()
            page.get_by_label('Рабочее пространство 1: путь', exact=True).wait_for()
            assert page.get_by_label('Рабочее пространство 1: путь', exact=True).input_value() == '/work'
            assert page.get_by_label('Режим выполнения', exact=True).input_value() == 'unrestricted'
            page.get_by_role('link', name='Клиенты', exact=True).click()
            page.get_by_label('Профиль нового подключения', exact=True).select_option('browser-ops')
            page.get_by_label('Роль нового подключения', exact=True).select_option('admin')
            page.get_by_role('button', name='Выдать managed token', exact=True).click()
            page.locator('.token-callout code').wait_for()
            issued = page.locator('.token-callout code').inner_text()
            assert issued.startswith('gptk_')
            page.get_by_role('link', name='Токены и подключение', exact=True).click()
            assert page.get_by_label('Выданный токен подключения').input_value() == issued
            page.get_by_role('link', name='Клиенты', exact=True).click()
            assert page.locator('.token-callout code').inner_text() == issued
            server.terminate()
            server.wait(timeout=10)
            server = subprocess.Popen([str(artifacts / 'ui-canary'), str(fixture), address], stdout=log, stderr=log)
            for _ in range(100):
                try:
                    urllib.request.urlopen(url + '/healthz', timeout=1).close()
                    break
                except Exception:
                    time.sleep(0.1)
            page.goto(url + '/admin/#clients')
            page.get_by_role('button', name='Показать сохранённый токен', exact=True).click()
            page.locator('.token-callout code').wait_for()
            assert page.locator('.token-callout code').inner_text() == issued
            assert page.get_by_label('Роль выбранного подключения', exact=True).input_value() == 'admin'
            profile = page.request.get(url + '/admin/api/access-profiles/browser-ops').json()
            assert profile['workspace_refs'][0]['workspace_path'] == '/work'
            operations = page.request.get(url + '/admin/api/operations').json()
            assert operations['total'] >= 3
            assert all(item['status'] == 'completed' for item in operations['operations'])
            page.goto(url + '/admin/#operations')
            page.get_by_role('heading', name='Операции доступа', exact=True).wait_for()
            page.get_by_text('Создание подключения', exact=True).wait_for()
            page.goto(url + '/admin/legacy/')
            page.wait_for_url('**/admin/#overview')
            page.locator('#status').filter(has_text='online').wait_for()
            page.set_viewport_size({'width': 390, 'height': 844})
            page.screenshot(path=str(artifacts / 'unified-mobile.png'), full_page=True)
            dimensions = page.evaluate('({width:innerWidth, content:document.documentElement.scrollWidth})')
            assert dimensions['content'] <= dimensions['width'] + 2, dimensions
            assert not errors, errors
            browser.close()
        print(json.dumps({'result': 'PASS', 'routes': len(routes), 'real_go_hub': True, 'profile_edit_and_restart': True, 'operations': operations['total'], 'token_retained_on_navigation': True, 'saved_token_after_restart': True, 'admin_role_visible': True, 'legacy_redirect': True, 'mobile': dimensions, 'page_errors': errors}, ensure_ascii=False))
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
