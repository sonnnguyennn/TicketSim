"""Print complete authored Guided evidence for manual review; never changes source."""
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[2]
cases = {c['id']: c for c in json.loads((root / 'src/data/guided-public.json').read_text(encoding='utf-8'))}
for tid in sys.argv[1:]:
    c = cases[tid]
    print(f'\n## {tid} | {c["objective"]}')
    print('CUSTOMER:', c['customerExplanation'])
    for p in c['probes']:
        print(f'PROBE {p["id"]} [{p["context"]}] {p["command"]} | output={p["output"]!r} | purpose={p.get("purpose", "")} | why={p.get("why", "")} | meaning={p.get("meaning", "")}')
    for q in c['questions']:
        fp = root / 'public/guided-feedback' / tid / (q['id'] + '.json')
        fb = json.loads(fp.read_text(encoding='utf-8')) if fp.exists() else {}
        print(f'Q {q["id"]} [{q["kind"]}] {q["prompt"]} | options={[(o["id"],o["label"]) for o in q.get("options", [])]} | key={fb.get("correctIds")} | explanation={fb.get("explanation", "")} | feedback={fb.get("optionFeedback", {})}')
    hp = root / 'public/guided-hints' / (tid + '.json')
    if hp.exists():
        print('HINTS:', hp.read_text(encoding='utf-8'))
    print('VERIFY PROMPT:', c['verificationPrompt'])
    print('SOLUTION:', json.dumps(json.loads((root / 'public/guided-answers' / (tid + '.json')).read_text(encoding='utf-8')), ensure_ascii=False))
