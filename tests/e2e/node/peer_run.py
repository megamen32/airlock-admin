#!/usr/bin/env python3
"""Real static peer routing: B owns the job even when ingress A disappears."""
import argparse
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('binary', type=Path)
    parser.add_argument('--protocol', choices=('rest', 'mcp', 'both'), default='both')
    args = parser.parse_args()
    for protocol in (('rest', 'mcp') if args.protocol == 'both' else (args.protocol,)):
        run_canary(args.binary.resolve(), protocol)


def run_canary(binary, protocol):
    project = Path(__file__).resolve().parents[3]
    root = Path(tempfile.mkdtemp(prefix='node-peer-canary-', dir=project / '.tmp'))
    token = secrets.token_urlsafe(32)
    nodes = {}
    # Reserve both ports together so they cannot accidentally be identical.
    with socket.socket() as a, socket.socket() as b:
        for name, sock in [('nodeA', a), ('nodeB', b)]:
            sock.bind(('127.0.0.1', 0))
            directory = root / name
            directory.mkdir()
            nodes[name] = dict(directory=directory, port=sock.getsockname()[1])
    for node in nodes.values():
        node['origin'] = f'http://127.0.0.1:{node["port"]}'

    versions = {}

    def request(name, path, body=None, authenticated=True):
        headers = {'Content-Type': 'application/json'}
        if path == '/mcp' and name in versions:
            headers['MCP-Protocol-Version'] = versions[name]
            headers['Mcp-Method'] = body['method']
            if body['method'] == 'tools/call':
                headers['Mcp-Name'] = body['params']['name']
        if authenticated:
            headers['Authorization'] = 'Bearer ' + token
        req = urllib.request.Request(nodes[name]['origin'] + path, headers=headers,
                                     data=None if body is None else json.dumps(body).encode())
        with urllib.request.urlopen(req, timeout=20) as response:
            return None if response.status == 204 else json.load(response)

    def initialize(name):
        response = request(name, '/mcp', {'jsonrpc': '2.0', 'id': 1, 'method': 'initialize',
            'params': {'protocolVersion': '2025-03-26', 'capabilities': {},
                       'clientInfo': {'name': 'node-peer-canary', 'version': '1'}}})
        assert 'result' in response, response
        versions[name] = response['result']['protocolVersion']
        request(name, '/mcp', {'jsonrpc': '2.0', 'method': 'notifications/initialized'})

    def mcp_tool(name, tool, arguments, authenticated=True):
        response = request(name, '/mcp', {'jsonrpc': '2.0', 'id': 2, 'method': 'tools/call',
            'params': {'name': tool, 'arguments': arguments}}, authenticated)
        assert 'error' not in response, response
        result = response['result']
        assert not result.get('isError'), result
        payload = dict(result['structuredContent'])
        payload.update({key: value for key, value in result.get('_meta', {}).items()
                        if key in ('owner_target', 'owner_endpoint')})
        return payload

    def call(name, body, authenticated=True):
        if protocol == 'mcp':
            return mcp_tool(name, 'execute', body, authenticated)
        return request(name, '/mcp-relay/call', body, authenticated)

    def get_receipt(name, job_id):
        if protocol == 'mcp':
            return mcp_tool(name, 'job', {'job_id': job_id})
        return request(name, '/mcp-relay/job/' + job_id)

    def stop(node):
        proc = node.get('proc')
        if proc is not None and proc.poll() is None:
            proc.terminate()
            try:
                code = proc.wait(timeout=12)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait()
                raise AssertionError('node did not stop after SIGTERM')
            assert code == 0, f'node shutdown exit {code}'

    try:
        for name, node in nodes.items():
            directory = node['directory']
            env = dict(os.environ, GPTADMIN_CONFIG_DIR=str(directory), GPTADMIN_ROOT=str(directory),
                       GPTADMIN_ENV_FILE=str(directory / 'absent.env'), GPTADMIN_HUB_HOST='127.0.0.1',
                       GPTADMIN_HUB_PORT=str(node['port']), CTL_TOKEN=token,
                       SHELL_TOKEN=secrets.token_urlsafe(32), OAUTH_CLIENT_SECRET=secrets.token_urlsafe(32),
                       PUBLIC_ORIGIN=node['origin'], SHELL_NAME=name, SHELL_IDENTITY_DIR=str(directory),
                       SHELL_SPOOL_DIR=str(directory / 'spool'),
                       SHELL_OUTBOX_DIR=str(directory / 'spool/outbox'),
                       SHELL_DEFAULT_CWD=str(directory), SHELL_DEFAULT_HOME=str(directory),
                       SHELLMCP_MCP_CONFIG=str(directory / 'no-child-mcp.json'),
                       HUB_URL='http://127.0.0.1:1', SHELLMCP_SELF_REPAIR_DISABLE='1',
                       GPTADMIN_NODE_PEERS=json.dumps({'shell:nodeB': nodes['nodeB']['origin']} if name == 'nodeA' else {}))
            node['log'] = (directory / 'runtime.log').open('w')
            node['proc'] = subprocess.Popen([str(binary)], cwd=directory, env=env,
                                            stdout=node['log'], stderr=node['log'])
        for name, node in nodes.items():
            deadline = time.monotonic() + 20
            while time.monotonic() < deadline:
                if node['proc'].poll() is not None:
                    raise AssertionError(f'{name} exited; see {node["directory"] / "runtime.log"}')
                try:
                    inventory = request(name, '/servers')
                    if any(x['name'] == name and x['status'] == 'online' for x in inventory['servers']):
                        break
                except (urllib.error.URLError, TimeoutError):
                    pass
                time.sleep(.1)
            else:
                raise AssertionError(f'{name} executor not ready')
        identities = [json.loads((node['directory'] / 'shellmcp_identity.json').read_text()) for node in nodes.values()]
        assert identities[0]['server_id'] != identities[1]['server_id'], 'nodes share an executor identity'
        assert identities[0]['public_key'] != identities[1]['public_key'], 'nodes share an executor key'
        if protocol == 'mcp':
            initialize('nodeA')
            initialize('nodeB')
        marker = secrets.token_hex(16)
        body = {'target': 'shell:nodeB', 'tool': 'shell_exec', 'background': True,
                'idempotency_key': 'peer-' + marker,
                'args': {'cmd': f'printf "%s\\n" {marker} >> peer-marker.txt; pwd; cat peer-marker.txt', 'timeout': 10}}
        for name in nodes:
            try:
                call(name, body, authenticated=False)
                raise AssertionError(f'{name} allowed anonymous execution')
            except urllib.error.HTTPError as exc:
                assert exc.code == 401, exc.code
        result = call('nodeA', body)
        job_id = result.get('job_id') or result.get('task_id')
        assert job_id, result
        assert result.get('owner_target') == 'shell:nodeB', result
        assert result.get('owner_endpoint') == nodes['nodeB']['origin'], result
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline:
            receipt = get_receipt('nodeB', job_id)
            if receipt.get('status') == 'completed':
                break
            time.sleep(.1)
        else:
            raise AssertionError(f'B job did not finish: {receipt}')
        output = nodes['nodeB']['directory'] / 'peer-marker.txt'
        assert output.read_text().splitlines() == [marker], receipt
        assert str(nodes['nodeB']['directory']) in json.dumps(receipt), receipt
        assert not (nodes['nodeA']['directory'] / 'peer-marker.txt').exists(), 'A executed B command'
        stop(nodes['nodeA'])
        if protocol == 'mcp':
            initialize('nodeB')
        try:
            call('nodeB', body, authenticated=False)
            raise AssertionError('B allowed anonymous replay after A stopped')
        except urllib.error.HTTPError as exc:
            assert exc.code == 401, exc.code
        replay = call('nodeB', body)
        assert (replay.get('job_id') or replay.get('task_id')) == job_id, replay
        assert replay.get('status') == 'completed', replay
        assert marker in json.dumps(replay), replay
        assert get_receipt('nodeB', job_id) == receipt
        assert output.read_text().splitlines() == [marker], 'duplicate side effect after ingress loss'
        fresh = call('nodeB', {
            'target': 'shell:nodeB', 'tool': 'shell_exec', 'idempotency_key': 'fresh-' + marker,
            'args': {'cmd': 'printf alive > after-a.txt; cat after-a.txt', 'timeout': 10}})
        fresh_id = fresh.get('job_id') or fresh.get('task_id')
        deadline = time.monotonic() + 20
        while fresh.get('status') != 'completed' and time.monotonic() < deadline:
            time.sleep(.1)
            fresh = get_receipt('nodeB', fresh_id)
        assert fresh.get('status') == 'completed', fresh
        assert (nodes['nodeB']['directory'] / 'after-a.txt').read_text() == 'alive', fresh
        assert not (nodes['nodeA']['directory'] / 'after-a.txt').exists()
        print(json.dumps({'ok': True, 'protocol': protocol, 'owner': 'shell:nodeB', 'job_id': job_id,
                          'ingress_a_stopped': True, 'replayed_receipt': True,
                          'distinct_executor_identities': True, 'fresh_command_after_a_loss': True,
                          'side_effect_count': 1, 'unauthorized_status': 401, 'evidence_dir': str(root)}))
    finally:
        for node in nodes.values():
            try:
                stop(node)
            finally:
                if 'log' in node:
                    node['log'].close()


if __name__ == '__main__':
    main()
