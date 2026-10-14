#!/usr/bin/env python3
"""Check the signup handoff file; resume the existing owner only for new results."""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.error
import urllib.request

MAX_FILE = 2 * 1024 * 1024


def event_ids(path):
    if path.stat().st_size > MAX_FILE:
        raise ValueError("Общий файл превысил бюджет 2 МиБ; нужна проверка владельца")
    result = []
    with path.open('rb') as source:
        for line in source:
            if not line.endswith(b'\n'):
                break  # An append may still be in progress.
            row = json.loads(line)
            target = row.get('to', [])
            target = [target] if isinstance(target, str) else target
            if (row.get('author') != 'codex-root'
                    and ('codex-root' in target or 'all' in target)
                    and row.get('type') not in ('ack', 'protocol', 'handoff')):
                result.append(hashlib.sha256(line).hexdigest())
    result = list(dict.fromkeys(result))
    if len(result) > 4096:
        raise ValueError('Нужен архив общего файла перед продолжением')
    return result


def save(path, state):
    temporary = path.with_suffix('.new')
    with open(temporary, 'w', opener=lambda p, f: os.open(p, f, 0o600)) as stream:
        json.dump(state, stream)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temporary, path)
    directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)


def herder_url():
    pid = subprocess.check_output(
        ['systemctl', '--user', 'show', 'agent-herder.service', '-p', 'MainPID', '--value'],
        text=True, timeout=4).strip()
    values = dict(item.split('=', 1) for item in
                  Path('/proc', pid, 'environ').read_bytes().decode().split('\0') if '=' in item)
    return 'http://127.0.0.1:' + str(int(values['AGENT_HERDER_WEB_PORT']))


def request(url, body=None):
    req = urllib.request.Request(url, data=None if body is None else json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as response:
        return json.loads(response.read(MAX_FILE))


def run(config, initialize=False):
    state_path = Path(config['state'])
    state_path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    with state_path.with_suffix('.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        current = event_ids(Path(config['chat']))
        state = json.loads(state_path.read_text()) if state_path.exists() else {'seen': []}
        if initialize:
            if state_path.exists():
                raise ValueError('Состояние уже существует; повторная инициализация запрещена')
            save(state_path, {'seen': current})
            print('Учтены уже прочитанные записи; новые результаты будут проверяться каждые пять минут')
            return
        if state.get('inflight'):
            print('Исход предыдущего продолжения неизвестен; повтор не отправлен. Проверить state.json')
            return
        pending = [key for key in current if key not in state['seen']]
        if not pending:
            return
        url = herder_url() + '/api/sessions/codex/' + config['session_id']
        session = request(url).get('session', {})
        if session.get('status') not in ('idle', 'completed') or session.get('needsPermission'):
            print('Есть новые записи; текущая работа или остановка чата сохранена')
            return
        input_id = 'airlock-marketplace-file-' + hashlib.sha256(''.join(pending).encode()).hexdigest()
        # Persist BEFORE admission. A crash/timeout must never replay unknown work.
        state['inflight'] = {'input_id': input_id, 'events': pending}
        save(state_path, state)
        body = {
            'humanRequested': False, 'inputId': input_id,
            'message': (
                'По поручению пользователя проверка общего файла нашла новые результаты или блокеры. '
                'Продолжай исходную задачу Airlock marketplace: сначала прочитай '
                + config['task'] + ' и новые записи ' + config['chat'] + '. '
                'Подключай реальные полученные API/MCP доступы к русскому демо. '
                'Не повторяй регистрации, отправки и операции с неизвестным исходом. '
                'Секреты только по private credentialref. Не меняй ручную остановку и чужую работу. '
                'Пользователю сообщай только существенный результат, ошибку или нужное решение.')}
        result = request(url + '/resume', body)
        if result.get('ok') or result.get('admitted'):
            state['seen'] = list(dict.fromkeys(state['seen'] + pending))[-4096:]
            state['last_input_id'] = input_id
            state.pop('inflight')
            save(state_path, state)
            print('Новые результаты переданы в исходный чат через Agent Herder')
        elif result.get('nonRetryable') or result.get('pending'):
            print('Продолжение требует проверки владельца; неизвестная операция сохранена без повтора')
        else:
            state.pop('inflight')
            save(state_path, state)
            print('Agent Herder пока не разрешил автоматическое продолжение; записи сохранены')


if __name__ == '__main__':
    try:
        os.umask(0o077)
        run(json.loads(Path(sys.argv[1]).read_text()), '--initialize' in sys.argv[2:])
    except Exception as error:
        # Do not log file contents, auth, or response payloads.
        print('Проверка общего файла не завершена: ' + type(error).__name__, file=sys.stderr)
        sys.exit(1)
