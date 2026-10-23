# Coding agent brief — VPS Support Ticket Simulator MVP

## Product objective
Build a **personal, local-first learning web app** for a beginner VPS Support intern. UI labels in Vietnamese; customer tickets in English. The dataset `tickets.json` contains 112 fictional, deterministic diagnostic cases. It is not a production troubleshooting engine.

## Non-negotiable behavioral requirements
1. **Hidden answer key**: `expected_diagnosis`, `resolution_guidance`, `verification`, and `escalate_when` must not be sent/rendered to the browser until trainee explicitly submits or reveals. For a local-only build with JSON embedded in the client, this is only a learning/UI guard, not real confidentiality; for strict answer isolation, serve probes via backend and guard the answer route.
2. **Simulated terminal only**: never pass typed commands to shell or eval. The app matches normalized user input against `probe_outputs[].command`, returns the fixture's `stdout`. Unknown commands show a helpful hint such as "Lệnh này chưa có dữ liệu mô phỏng cho ticket này" and do NOT invent live outputs.
3. **Realistic workflow**: show ticket initially, not command outputs. Trainee chooses/enters commands and requests outputs one by one.
4. **Safe execution**: `PANEL:` / `BILLING:` / `BACKUP LOG:` are simulated investigator actions, not real Linux terminal commands. Display them as separate panel/log inspection buttons or investigations. `VM-safe` does not grant permission on production.
5. **Never use credentials/secrets**: synthetic examples only. No API key needed for deterministic MVP.

## Pages / core UX
- Dashboard: 112 total cases, progress, grouped topics, filter by level (L0..L3) / topic / status.
- Ticket detail: Customer message, status, subject, environment, optional hints.
- Investigate view: virtual terminal + selectable recommended probes (L0 only) + stepwise output history. For L2/L3 consider hiding commands until user asks for hints.
- Diagnosis form: Issue summary, hypothesis, evidence citations from outputs, next check, action, verification, escalation/need help.
- Review: local scoring rubric weighted symptom 2, evidence 3, next check 2, safe resolution 2, verify/escalation 1; initially show self-check and answer comparison. Do **not** claim exact AI grading without actual grader.
- Progress: mark attempts and completion, preserve previous answers.
- Settings: show whether ticket is fixture only; reset progress and export/import progress JSON.

## Suggested data model
Read and validate `tickets.json` against `ticket_schema.json`.
`Ticket`: id, topic, difficulty, customer_message, guest_os, environment, probe_outputs, expected_diagnosis, recommended_next_checks, resolution_guidance, verification, escalate_when, hint, hands_on_mode, scoring_rubric.
`Probe`: command, stdout, mutates_guest=false.
`Attempt`: ticket_id, created_at, command_history, diagnosis_form, viewed_hint, revealed_answer, self_score, status.

## Staged delivery
**MVP-1**: frontend only (e.g. React + TypeScript), import fixture dataset, list/filter tickets, virtual probe output, note form, answer reveal, localStorage progress.
**MVP-2**: support evidence linking (probe IDs), state machine for workflow, deterministic rubric tags, spaced review / random ticket queue, multi-attempt history.
**MVP-3 (optional)**: safe VM lab orchestration on user's own VirtualBox machine. Separate backend, explicit allowlisted scripts only, snapshot/restore, authentication, no free-form exec, refuse destructive actions by default.

## Important limitations / correctness
- Case outputs are simulated **not actual command results** from user's CentOS VM.
- Many advanced cases indicate a likely fault and escalation, not a provable production root cause. Display uncertainty appropriately.
- Native CentOS Stream 9 uses `sshd`, `dnf`, `firewall-cmd`, `nmcli`, SELinux; Ubuntu examples should be labeled separately.
- Do not infer the actual support provider's policies, SLAs, specific panel APIs, or incident procedures from generic cases.
- For source-dependent traffic incidents, do not conclude upstream is definitely at fault from one ping/mtr result.

## Acceptance criteria
- All 112 tickets load with unique IDs, 14 topics, 4 levels; 2 per level/topic.
- User can filter/select/solve tickets without internet access or API keys.
- For each ticket, 2 probes return exact fixture output. Unsupported command is handled explicitly (not fabricated).
- Answer hidden until reveal/submit; trainee's notes persist across reload.
- Every review includes diagnosis, checks, action, verification, escalation, and risk warning.
- Tests cover JSON import, filtering, score calculation, probe matching, unknown command, progress persistence.
- Basic keyboard accessibility and responsive layout.

## Sample commands to test manually
1. Open `VPS-01-001`: request `systemctl status sshd`, expect `inactive (dead)`.
2. Open `VPS-02-001`: `ip route` lacks `default`.
3. Open `VPS-05-002`: `df -i /` reads 100% inode utilization.
4. Enter `rm -rf /` in simulator: should **never execute**; show unsupported/safety guidance.
5. Confirm solution initially concealed and accessible after reveal only.
