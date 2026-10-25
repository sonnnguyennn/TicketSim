"""Read-only Phase C ledger generator. Structural validation never grants semantic sign-off."""
import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
CASES = json.loads((ROOT / 'src/data/guided-public.json').read_text(encoding='utf-8'))
TICKETS = {t['id']: t for t in json.loads((ROOT / 'starter-data/tickets.json').read_text(encoding='utf-8'))['tickets']}


def write(name, fields, rows):
    with (OUT / name).open('w', newline='', encoding='utf-8-sig') as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(rows)


findings = list(csv.DictReader((OUT / '04_Finding_Register.csv').open(encoding='utf-8-sig', newline='')))
by_target = Counter(f['target_id'] for f in findings)
target_dimensions = defaultdict(set)
for finding in findings:
    target_dimensions[finding['target_id']].add(finding['audit_dimension'])
question_finding_ids = {
    'VPS-01-008/output': 'PC-010',
    'VPS-02-006/check': 'PC-016',
    'VPS-08-008/triage': 'PC-014',
    'VPS-10-001/check': 'PC-006',
    'VPS-10-006/check': 'PC-017',
    'VPS-12-007/output': 'PC-004',
    'VPS-13-001/check': 'PC-007',
    'VPS-13-008/decision': 'PC-015',
}
ledger_path = OUT / 'review-ledger.json'
ledger = json.loads(ledger_path.read_text(encoding='utf-8')) if ledger_path.exists() else {}
semantic_tickets = set(ledger.get('semantic_tickets', []))
semantic_commands = set(ledger.get('semantic_commands', []))
semantic_questions = set(ledger.get('semantic_questions', []))
semantic_fixtures = set(ledger.get('semantic_fixtures', []))
internal_sop_tickets = set(ledger.get('internal_sop_tickets', []))


def review_fields(reviewed, needs_sop=False):
    """Keep review, independent source, lab, and SOP gates distinct."""
    return {
        'semantic_review': 'SEMANTIC_REVIEW' if reviewed else 'PENDING',
        'review_depth': 'SEMANTIC_REVIEW' if reviewed else 'STRUCTURAL_VALIDATION',
        'verification_level': 'INTERNAL_SOP_REQUIRED' if needs_sop else ('REASONED_ONLY' if reviewed else 'PENDING'),
        'source_verification': 'PENDING',
        'lab_verification': 'PENDING',
        'internal_sop': 'INTERNAL_SOP_REQUIRED' if needs_sop else 'NOT_APPLICABLE',
    }


def finding_result(reviewed, has_finding):
    if not reviewed:
        return 'PENDING'
    return 'FINDING_OPEN' if has_finding else 'NO_ISSUE_IDENTIFIED_IN_REVIEW'


def dimension_result(target_id, reviewed, *dimensions):
    return finding_result(reviewed, bool(target_dimensions[target_id].intersection(dimensions)))


assert semantic_tickets <= {c['id'] for c in CASES}
assert internal_sop_tickets <= {c['id'] for c in CASES}
ticket_rows = []
question_rows = []
for case in CASES:
    tid = case['id']
    source = TICKETS[tid]
    questions = case['questions']
    auto_issues = []
    for question in questions:
        qid = question['id']
        feedback_path = ROOT / 'public/guided-feedback' / tid / (qid + '.json')
        if question['kind'] == 'short_answer':
            continue
        feedback = json.loads(feedback_path.read_text(encoding='utf-8')) if feedback_path.exists() else {}
        opts = {o['id'] for o in question.get('options', [])}
        keys = set(feedback.get('correctIds', []))
        issues = []
        if not keys or not keys <= opts:
            issues.append('missing_or_invalid_key')
        if set(feedback.get('optionFeedback', {})) != opts:
            issues.append('feedback_coverage')
        if not feedback.get('explanation'):
            issues.append('missing_explanation')
        for pid in question.get('requiredProbeIds', []):
            if pid not in {p['id'] for p in case['probes']}:
                issues.append('missing_required_probe')
        auto_issues.extend(issues)
        question_rows.append({
            'ticket_id': tid, 'question_id': qid, 'kind': question['kind'],
            'option_count': len(opts), 'correct_count': len(keys),
            'structural_validation': 'FAIL' if issues else 'PASS',
            **review_fields(f'{tid}/{qid}' in semantic_questions, tid in internal_sop_tickets),
            'status': 'FLAGGED' if issues else ('FINDING_OPEN' if f'{tid}/{qid}' in question_finding_ids else ('REVIEWED' if f'{tid}/{qid}' in semantic_questions else 'PENDING')),
            'related_findings': question_finding_ids.get(f'{tid}/{qid}', ''),
            'issues': ';'.join(issues),
            'source': f'scripts/content/phase-b-* (authoring); public/guided-feedback/{tid}/{qid}.json (generated)',
        })
    ticket_rows.append({
        'ticket_id': tid, 'topic': source['topic'], 'level': 'L' + str(source['difficulty']),
        'technical_accuracy': dimension_result(tid, tid in semantic_tickets, 'TECHNICAL_CORRECTNESS', 'QUIZ_CORRECTNESS'),
        'evidence_sufficiency': dimension_result(tid, tid in semantic_tickets, 'EVIDENCE_SUFFICIENCY', 'QUIZ_CORRECTNESS'),
        'operational_realism': dimension_result(tid, tid in semantic_tickets, 'OPERATIONAL_REALISM'),
        'safety': dimension_result(tid, tid in semantic_tickets, 'SAFETY'),
        'quiz_quality': dimension_result(tid, tid in semantic_tickets, 'QUIZ_QUALITY', 'QUIZ_CORRECTNESS'),
        'learning_clarity': dimension_result(tid, tid in semantic_tickets, 'EDITORIAL'),
        'structural_validation': 'PASS' if not auto_issues else 'FAIL',
        **review_fields(tid in semantic_tickets, tid in internal_sop_tickets),
        'status': 'FINDING_OPEN' if by_target[tid] else ('REVIEWED' if tid in semantic_tickets else 'PENDING'),
        'findings_count': by_target[tid],
        'notes': f"{len(questions)-1} objective questions; {len(case['probes'])} probes; {len(auto_issues)} structural flags. "
                 + ('See finding register.' if by_target[tid] else 'Manual semantic review found no issue; source/lab gates remain pending.'),
    })

sources = [('src/guided/commands.ts', r"\bdoc\('([^']+)',\s*'([^']+)',\s*'([^']+)'") ,
           ('src/guided/moreCommands.ts', r"\bcard\('([^']+)',\s*'([^']+)',\s*'([^']+)'")]
cards = []
for path, pattern in sources:
    body = (ROOT / path).read_text(encoding='utf-8')
    for match in re.finditer(pattern, body):
        cid, family, command = match.groups()
        cards.append((cid, family, command, path, body[:match.start()].count('\n') + 1))
command_rows = []
for cid, family, command, path, line in cards:
    command_rows.append({
        'command_id': cid, 'category': family,
        'syntax_correct': dimension_result(cid, cid in semantic_commands, 'COMMAND_SYNTAX'),
        'flags_correct': dimension_result(cid, cid in semantic_commands, 'COMMAND_FLAGS'),
        'examples_correct': dimension_result(cid, cid in semantic_commands, 'COMMAND_EXAMPLE'),
        'output_correct': dimension_result(cid, cid in semantic_commands, 'COMMAND_OUTPUT'),
        'safety_correct': dimension_result(cid, cid in semantic_commands, 'SAFETY'),
        'guided_consistency': dimension_result(cid, cid in semantic_commands, 'COMMAND_CONSISTENCY'),
        'missing_important_flags': 'PENDING' if cid not in semantic_commands else 'NONE_IDENTIFIED',
        'structural_validation': 'PASS',
        **review_fields(cid in semantic_commands),
        'status': 'FINDING_OPEN' if by_target[cid] else ('REVIEWED' if cid in semantic_commands else 'PENDING'),
        'findings_count': by_target[cid],
        'notes': f'{path}:{line}; {command}. ' + ('See finding register.' if by_target[cid] else 'Manual semantic review; no independent execution.'),
    })

write('02_Ticket_Audit.csv', list(ticket_rows[0]), ticket_rows)
write('03_Command_Audit.csv', list(command_rows[0]), command_rows)
write('08_Question_Scan.csv', list(question_rows[0]), question_rows)
fixture_report = (ROOT / 'Phase_B_Fixture_Changes.md').read_text(encoding='utf-8')
fixture_rows = []
for match in re.finditer(r'^## (VPS-\d\d-\d\d\d)/(\w+)\s*$', fixture_report, re.M):
    tid, pid = match.groups()
    case = next(c for c in CASES if c['id'] == tid)
    probe = next(p for p in case['probes'] if p['id'] == pid)
    fixture_rows.append({
        'ticket_id': tid, 'probe_id': pid, 'command': probe['command'],
        'source': f"Phase_B_Fixture_Changes.md:{fixture_report[:match.start()].count(chr(10)) + 1}",
        'structural_validation': 'PASS',
        **review_fields(f'{tid}/{pid}' in semantic_fixtures, tid in internal_sop_tickets),
        'status': 'REVIEWED' if f'{tid}/{pid}' in semantic_fixtures else 'PENDING',
        'notes': 'No lab execution or independent command/output verification.',
    })
write('09_Fixture_Override_Scan.csv', list(fixture_rows[0]), fixture_rows)
assert len(ticket_rows) == 112 and len(command_rows) == 122 and len(question_rows) == 620
assert len(fixture_rows) == 101
assert len({row['command_id'] for row in command_rows}) == 122
assert semantic_commands <= {row['command_id'] for row in command_rows}
assert semantic_questions <= {f"{r['ticket_id']}/{r['question_id']}" for r in question_rows}
assert semantic_fixtures <= {f"{r['ticket_id']}/{r['probe_id']}" for r in fixture_rows}
print(f'{len(ticket_rows)} tickets ({len(semantic_tickets)} semantic), {len(command_rows)} cards ({len(semantic_commands)} semantic), {len(question_rows)} scored questions ({len(semantic_questions)} semantic), {len(fixture_rows)} overrides ({len(semantic_fixtures)} semantic); {len(findings)} findings')
