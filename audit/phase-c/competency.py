"""Build a coverage matrix, not a learner proficiency score."""
import csv
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
out = Path(__file__).resolve().parent / '10_Competency_Matrix.csv'
cases = json.loads((root / 'src/data/guided-public.json').read_text(encoding='utf-8'))
tickets = {t['id']: t for t in json.loads((root / 'starter-data/tickets.json').read_text(encoding='utf-8'))['tickets']}
ledger = json.loads((out.parent / 'review-ledger.json').read_text(encoding='utf-8'))
reviewed = set(ledger['semantic_tickets'])

network_topics = {1, 2, 7, 8}
network_cases = {
    'VPS-09-002', 'VPS-09-005', 'VPS-09-006', 'VPS-10-002', 'VPS-10-003',
    'VPS-12-001', 'VPS-12-006', 'VPS-13-002', 'VPS-13-003', 'VPS-13-005',
    'VPS-13-006', 'VPS-14-005',
}
fields = [
    'ticket_id', 'topic', 'level', 'objective', 'semantic_review', 'symptom_triage',
    'command_selection', 'output_interpretation', 'networking',
    'guest_provider_distinction', 'safety', 'verification', 'escalation',
    'customer_communication', 'competency_evidence_limit',
]
rows = []
for case in cases:
    tid = case['id']
    kinds = {q['kind'] for q in case['questions']}
    contexts = {p['context'] for p in case['probes']}
    answers = json.loads((root / 'public/guided-answers' / (tid + '.json')).read_text(encoding='utf-8'))
    escalation_text = (answers.get('escalate_when') or '').lower()
    has_escalation_choice = any(
        q['id'] == 'decision' and any(
            word in option['label'].lower() for word in ('chuyển', 'owner', 'đội', 'billing', 'security')
        ) for q in case['questions'] for option in q.get('options', [])
    )
    rows.append({
        'ticket_id': tid,
        'topic': tickets[tid]['topic'],
        'level': 'L' + str(tickets[tid]['difficulty']),
        'objective': case['objective'],
        'semantic_review': 'SEMANTIC_REVIEW' if tid in reviewed else 'PENDING',
        'symptom_triage': 'OBJECTIVE_PRACTICE' if 'single_choice' in kinds else 'NOT_TARGETED',
        'command_selection': 'OBJECTIVE_PRACTICE' if 'command_choice' in kinds else 'NOT_TARGETED',
        'output_interpretation': 'OBJECTIVE_PRACTICE' if 'output_interpretation' in kinds else 'NOT_TARGETED',
        'networking': 'OBJECTIVE_PRACTICE' if int(tid[4:6]) in network_topics or tid in network_cases else 'NOT_TARGETED',
        'guest_provider_distinction': 'CROSS_CONTEXT_EVIDENCE' if 'guest' in contexts and ('panel' in contexts or 'hypervisor' in contexts) else ('CONTEXT_ONLY' if 'panel' in contexts or 'hypervisor' in contexts else 'NOT_TARGETED'),
        'safety': 'OBJECTIVE_PRACTICE' if any(q['id'] == 'decision' for q in case['questions']) else 'GUIDANCE_ONLY',
        'verification': 'ORDER_AND_SELF_REVIEW' if 'step_order' in kinds else 'SELF_REVIEW_PROMPT',
        'escalation': 'OBJECTIVE_PRACTICE' if has_escalation_choice else ('GUIDANCE_ONLY' if escalation_text else 'NOT_TARGETED'),
        'customer_communication': 'SELF_REVIEW_PROMPT',
        'competency_evidence_limit': 'Coverage of authored training only; no learner performance, lab, or production certification.',
    })
with out.open('w', encoding='utf-8-sig', newline='') as handle:
    writer = csv.DictWriter(handle, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)
assert len(rows) == 112
print(f'{len(rows)} competency rows')
