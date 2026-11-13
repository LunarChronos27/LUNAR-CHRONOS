from pathlib import Path
from datetime import datetime
import subprocess
import sys

ROOT = Path.cwd()
TARGETS = [ROOT / 'src' / 'App.tsx', ROOT / 'src' / 'CLPSBrowser.tsx']
MARKERS = ('â', 'Â', 'Ã', 'ï¿½')

# Windows-1252 byte mapping, including the five undefined control positions.
def cp1252_bytes(text):
    out = bytearray()
    for ch in text:
        code = ord(ch)
        if code < 0x80 or 0xA0 <= code <= 0xFF:
            out.append(code)
        elif 0x80 <= code <= 0x9F:
            try:
                out.extend(ch.encode('cp1252'))
            except UnicodeEncodeError:
                out.append(code)
        else:
            raise UnicodeEncodeError('cp1252', ch, 0, 1, 'character outside Windows-1252')
    return bytes(out)

def repair_run(run):
    if not any(marker in run for marker in MARKERS):
        return run
    current = run
    for _ in range(3):
        try:
            candidate = cp1252_bytes(current).decode('utf-8')
        except (UnicodeDecodeError, UnicodeEncodeError):
            break
        if candidate == current:
            break
        current = candidate
    return current

stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
changed_files = []
for path in TARGETS:
    if not path.is_file():
        print(f'SKIP: missing {path.relative_to(ROOT)}')
        continue
    with path.open('r', encoding='utf-8', newline='') as handle:
        original = handle.read()
    # Repair only non-ASCII runs that contain known mojibake indicators.
    import re
    repaired = re.sub(r'[^\x00-\x7F]+', lambda m: repair_run(m.group(0)), original)
    if repaired != original:
        backup = path.with_name(path.name + f'.before-text-repair-{stamp}.bak')
        backup.write_bytes(path.read_bytes())
        with path.open('w', encoding='utf-8', newline='') as handle:
            handle.write(repaired)
        changed_files.append(path)
        print(f'REPAIRED: {path.relative_to(ROOT)}')
        print(f'BACKUP:   {backup.name}')
    else:
        print(f'NO CHANGE: {path.relative_to(ROOT)}')

# Report remaining suspicious markers in active source files only.
remaining = []
for path in TARGETS:
    if path.is_file():
        with path.open('r', encoding='utf-8', newline='') as handle:
            for number, line in enumerate(handle, 1):
                if any(marker in line for marker in MARKERS):
                    remaining.append((path.name, number, line.rstrip()))

if remaining:
    print('\nREVIEW REQUIRED: suspicious text remains:')
    for name, number, line in remaining:
        print(f'{name}:{number}: {line}')
else:
    print('\nTEXT CHECK: no known mojibake markers remain in the two active files.')

if changed_files:
    print('\nRunning production build...')
    result = subprocess.run('npm.cmd run build', cwd=ROOT, shell=True)
    if result.returncode != 0:
        print('\nBUILD FAILED. Source backups were preserved; do not continue editing.')
        sys.exit(result.returncode)
    print('\nBUILD PASSED.')
else:
    print('\nNo source changes were necessary; build was not run.')
