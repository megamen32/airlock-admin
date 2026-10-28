#!/usr/bin/env python3
"""One paid-credit analysis with durable intent; never retry an uncertain POST.

Operator only. The key stays in the existing protected account store. The
result is captured once for a public fictional-contract demo; guests never
call this executable or the provider's analysis endpoint.
"""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.request


def save(path, value):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w") as output:
        json.dump(value, output, ensure_ascii=False, indent=2)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--state', required=True, type=Path)
    p.add_argument('--document', type=Path, default=Path(__file__).parent / 'demo-data/legiscan-contract.txt')
    args = p.parse_args()
    args.state.mkdir(mode=0o700, parents=True, exist_ok=True)
    doc = args.document.read_text()
    if 'AIRLOCK-DEMO-001' not in doc or not 100 <= len(doc) <= 12000:
        raise SystemExit('Only the bounded fictional demo contract is accepted')
    account = json.loads((Path.home()/'.config/airlock-marketplace-accounts/legiscan.json').read_text())
    key = account['api_key']
    save(args.state/'intent.json', {
        'started_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'document_sha256': hashlib.sha256(doc.encode()).hexdigest(),
        'endpoint': 'https://legiscan.ru/api/edo/analyze',
        'max_successful_analyses_this_run': 1, 'automatic_retries': 0,
        'state': 'reserved; reconcile before any new attempt',
    })
    payload = json.dumps({'text': doc, 'fileName': 'airlock-demo-contract.txt'}, ensure_ascii=False).encode()
    request = urllib.request.Request('https://legiscan.ru/api/edo/analyze', data=payload,
                                    headers={'Content-Type': 'application/json', 'X-API-Key': key}, method='POST')
    started = time.monotonic()
    try:
        try:
            response = urllib.request.urlopen(request, timeout=180)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            body = response.read(2*1024*1024+1)
            status = response.status
        if len(body) > 2*1024*1024:
            raise RuntimeError('Response limit exceeded; outcome requires reconciliation')
        # Reject accidental credential reflection before retaining any response.
        if key.encode() in body:
            raise RuntimeError('Credential reflected by provider; response not retained')
        data = json.loads(body)
        save(args.state/'response.json', data)
        ok = status == 200 and isinstance(data.get('result'), dict) and bool(data['result'])
        result = {'http_status': status, 'elapsed_seconds': round(time.monotonic()-started,3),
                  'successful_analyses_observed': int(ok), 'automatic_retries': 0,
                  'response_sha256': hashlib.sha256(body).hexdigest(),
                  'result_keys': sorted(data.get('result',{})) if ok else [],
                  'provider_error': data.get('error') if not ok else None}
        save(args.state/'receipt.json', result)
        print(json.dumps(result, ensure_ascii=False))
        if not ok:
            raise SystemExit('Provider did not return a successful analysis; no automatic retry')
    except Exception as error:
        # Never log the request, headers or arbitrary exception representations.
        save(args.state/'unknown.json', {'state':'unknown; do not retry', 'error_type':type(error).__name__,
                                       'elapsed_seconds':round(time.monotonic()-started,3)})
        raise SystemExit('Analysis outcome needs reconciliation; no retry performed') from None


if __name__ == '__main__':
    main()
