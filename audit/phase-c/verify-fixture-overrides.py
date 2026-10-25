"""Read-only check that documented Phase B overrides match effective Guided data."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[2]
report = (root / 'Phase_B_Fixture_Changes.md').read_text(encoding='utf-8')
cases = {c['id']: c for c in json.loads((root / 'src/data/guided-public.json').read_text(encoding='utf-8'))}
parts = re.split(r'^## (VPS-\d\d-\d\d\d)/(\w+)\s*$', report, flags=re.M)
issues = []
for index in range(1, len(parts), 3):
    ticket_id, probe_id, section = parts[index:index + 3]
    after = re.search(r'Sau:\s*```text\n(.*?)\n```', section, re.S)
    if after is None:
        issues.append(f'{ticket_id}/{probe_id}: missing after block')
        continue
    documented = after.group(1).replace('␠', ' ').replace('⇥', '\t')
    probe = next((p for p in cases[ticket_id]['probes'] if p['id'] == probe_id), None)
    if probe is None or probe['output'] != documented:
        issues.append(f'{ticket_id}/{probe_id}: generated output differs from documented after block')
assert (len(parts) - 1) // 3 == 101
if issues:
    raise SystemExit('\n'.join(issues))
print('101/101 documented overrides match effective Guided output; this does not lab-verify command behavior.')
