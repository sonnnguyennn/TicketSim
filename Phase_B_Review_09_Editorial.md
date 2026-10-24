# Phase B topic 09 editorial sidecar

`scripts/content/phase-b-09-editorial.mjs` exports an explicit `editorialEdits` map. It provides 327 dotted-path replacements across the eight topic 09 Guided cases. Each key targets an existing learner-facing field in `scripts/content/phase-b-06-10.mjs`. The sidecar does not edit fixture stdout, command IDs, question or option IDs, correct answers, gates, or review metadata.

| Case | Editorial review |
| --- | --- |
| 09-001 | Separated failed SSH attempts from successful access. A short auth log and `last` sample do not prove compromise or a clean system. |
| 09-002 | Restored spaces around office source IP, jail status, Ban timestamp and policy. The matched IP supports a source-specific ban, while the cause of failed auth and permission to unban remain open. |
| 09-003 | Restored SELinux and AVC language. Enforcing mode, `name_connect` denial and backend listener are separate observations; a narrow authorized policy review precedes verification in Enforcing. |
| 09-004 | Clarified account entry, sudo grant and approval as distinct facts. The account is not deleted merely because the owner does not recognize the name. |
| 09-005 | Clarified provider notice, outbound SMTP socket, PID and volume. Neither a Python process nor a traffic spike alone proves spam or malware. |
| 09-006 | Rewrote heavily joined text for provider mitigation and upstream null-route. Incident ownership does not mean service recovery, and guest firewall changes cannot clear an upstream route. |
| 09-007 | Reviewed pilot wording. Successful root access is established; identity and authorization require security investigation. Shortened two correct option labels without changing the evidence or key. |
| 09-008 | Rewrote heavily joined text for root cron, process and hash. A recurring job and changed hash support investigation but do not independently prove malicious intent. |

## Focused validation

- `node --check scripts/content/phase-b-09-editorial.mjs`: passed.
- Imported the sidecar and topic 06–10 authoring module: all eight topic 09 case IDs are present and all 327 dotted paths exist with matching target types.
- Inspected the effective question prompt, explanation, all option labels and feedback for every topic 09 case, including the output question. Cases 09-001 through 09-006 and 09-008 replace every learner-facing field; 09-007 has two targeted option corrections.
- Rechecked answer-length cues: Security went from 20/32 to 5/32 single-choice questions where the correct label is uniquely longest. Shorter labels retain their full technical explanation in feedback; no grading key changed.
- Applied the edited eight cases in memory through `applyGuidedEdits`: all 44 questions passed the existing identity and shape checks.
- Every replacement is authored case by case. The map contains no output, command, identity, grading, gate or review paths.

The root integration pass must apply this sidecar, rerun the full content audit and regenerate data before unit, browser and build gates. This editorial review alone does not claim those gates passed.
