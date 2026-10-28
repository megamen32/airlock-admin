#!/usr/bin/env python3
"""Observe the Airlock Yandex Disk allocation; never delete or block objects."""
import json
import os
from pathlib import Path
import subprocess
import sys


def main():
    budget = int(os.environ['AIRLOCK_YADISK_BUDGET_BYTES'])
    warning = int(os.environ['AIRLOCK_YADISK_WARNING_BYTES'])
    if not 0 < warning < budget:
        raise ValueError('invalid storage budget thresholds')
    remote = os.environ['AIRLOCK_YADISK_REMOTE']
    rclone = str(Path.home() / '.local/bin/rclone')
    result = subprocess.run([rclone, 'size', remote, '--json'],
                            capture_output=True, text=True, timeout=240)
    if result.returncode:
        raise RuntimeError('could not measure Yandex Disk storage')
    usage = json.loads(result.stdout)
    used = int(usage['bytes'])
    if used < 0 or int(usage.get('sizeless', 0)):
        raise ValueError('storage usage is incomplete')
    level = 'critical' if used >= budget else 'warning' if used >= warning else 'ok'
    print(json.dumps({'status': level, 'bytes': used, 'objects': usage['count'],
                      'budgetBytes': budget, 'warningBytes': warning,
                      'remainingBytes': max(0, budget-used), 'enforcement': 'monitoring'}))
    return 2 if level == 'critical' else 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print('Airlock storage quota check failed: ' + type(error).__name__, file=sys.stderr)
        sys.exit(1)
