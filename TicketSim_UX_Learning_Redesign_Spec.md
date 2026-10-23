# TicketSim — UX & Learning Redesign (Living Spec / Agent Handoff)

## Current state and pickup guide — 2026-10-23

### Phase 5C pickup update

Batch 7 completes Guided coverage: **112/112** across 14 topics and all four difficulties. The original 112 tickets and v5 progress format remain unchanged. Stateful, Objective Exam and independent variants are still **6/112 each** at this checkpoint. See `Phase_5C_Batch_7_QA.md`. Phase 5D/5E independent assessment and broader case-by-case browser QA remain open.

Batch 6 is implemented: **104/112 Guided**, covering all backup and control-panel tickets. The 112 source tickets and v5 progress format remain unchanged. Stateful, Objective Exam and independent variants remain **6/112**. See `Phase_5C_Batch_6_QA.md`. Batch 7 and independent assessment expansion remain open.

Batch 5 is implemented: **88/112 Guided**, covering all security and container tickets. Empty stdout fixtures are explicitly supported for two Docker checks; they are supplemented by further probes and do not produce invented output. No changes were made to the 112 source tickets or v5 progress format. Stateful, Objective Exam and independent variants remain **6/112**. See `Phase_5C_Batch_5_QA.md`. Batch 6–7 and independent assessment expansion remain open.

Batch 4 is implemented: **72/112 Guided**, with all eight VPS lifecycle and eight virtualization tickets covered. Panel, guest and hypervisor context is distinguished in Guided. The source 112 and v5 progress format remain unchanged; Stateful, Objective Exam and variant counts remain **6/112**. See `Phase_5C_Batch_4_QA.md`. Batch 5–7 and independent assessment expansion remain open.

Batch 3 is implemented: **56/112 Guided**. The 14 new cases complete the priority SSH, Network, Services, Performance, Disk, Web and DNS topics. Guided-only output overrides replace editorial annotations in `VPS-07-003` and `VPS-08-006`; the 112 source tickets and their original probes remain unchanged. Stateful, Objective Exam and independent Mastered variants remain at **6/112**. See `Phase_5C_Batch_3_QA.md`. Batch 4–7, Objective Exam expansion and review variant expansion remain open. Counts in the Phase 1–2 section below describe the previous pickup point.

### Phase 1–2 pickup update

Milestone 5B and the first Guided expansion batch are now implemented. The app has 42/112 Guided cases, 96 command/task cards, six Stateful + Objective Exam cases, and six independent review variants with delayed first-try Mastered. The 30 new Guided cases span SSH, Network, Linux Services, Performance, Disk, Web and DNS; L2/L3 require extra authored probes before interpretation. Beginner/Normal/Independent support and knowledge-level Review Mistakes are now in the app. Desktop/mobile Chromium, keyboard, import/export, refresh and migration smoke tests are in `tests/browser.spec.ts`. See `Milestone_5B_QA.md`, `Phase_2_Guided_QA.md`, `Guided_112_Batch_Plan.md` and `Phase_4_QA.md`. The older 12-case figures below are the Milestone 5A pickup snapshot, retained as history; `README.md` and `ROADMAP.md` carry current counts. A Git repository was initialized with baseline and per-phase commits.

### Milestone 5A pickup update

Six of the 12 Guided cases now have a separate Stateful Simulator and Objective Exam: `VPS-01-001`, `VPS-02-001`, `VPS-03-001`, `VPS-05-001`, `VPS-05-004`, `VPS-08-003`. Authored state transitions and post-action fixtures live in `scripts/guided-content.mjs`. The pure transition/verification engine is `src/guided/stateful.ts`; its UI is `src/guided/StatefulWorkspace.tsx`. Objective Exam uses six authored choice questions per case and separate feedback files; the free-text Legacy Exam remains self-assessed on all 112. v5 progress migrates v1–v4. Repeating an identical retest no longer grants Mastered; scenario variants need authoring. The original source ticket fixtures are unchanged. See `README.md` and `ROADMAP.md` for scope and remaining work.

**Canonical copy:** this file at the project root (`E:/Document/TicketSim/TicketSim_UX_Learning_Redesign_Spec.md`). The design proposal below is retained for intent; sections 1 and 12 describe the pre-redesign baseline and original phase plan. Use this section plus `ROADMAP.md` for the current implementation state.

**Delivery decision:** Keep all 112 original tickets and move toward a full learning refresh in layers: Practice/Legacy Exam is available on all 112, scored Guided on 12, and Stateful/Objective Exam on 6. Continue authoring case by case; do not connect to a real VPS.

### Implemented now

- React/TypeScript/Vite local app retains 112 tickets, 14 topics and L0–L3. The original 224 probe outputs are unchanged. Every ticket has Practice and Exam; 12 reviewed tickets additionally show **Học có hướng dẫn**. The ticket list has **Chỉ bài Guided (12)**.
- Eight original L0 pilot IDs: `VPS-01-001`, `VPS-01-002`, `VPS-02-001`, `VPS-03-001`, `VPS-05-001`, `VPS-05-002`, `VPS-07-001`, `VPS-08-002`. Four added L1 cases: `VPS-01-003`, `VPS-03-003`, `VPS-05-004`, `VPS-08-003`.
- Guided has 5 stages (Triage, Investigate, Interpret, Decide, Verify), 2–4 authored probes per case, 5 or 6 objective questions, answer-specific feedback, 3 gated hint levels and one short final ticket note. Four L0 pilots add `step_order`; the note is a `short_answer` self-review requiring 30 non-whitespace characters and is **not automatically graded**. A wrong objective answer still permits progression after feedback. Full diagnosis appears after submission.
- Guided terminal recognizes only a case's literal commands and explicit aliases; it normalizes case and whitespace. It distinguishes available fixture output, known library command without case output, restricted change action and unrecognized syntax. `sudo systemctl status sshd` is a vetted alias for the SSH pilot. No shell, SSH, VirtualBox, `eval` or runtime output generation is used.
- Searchable library contains 76 reviewed command/task cards with purpose, parameters, CentOS Stream 9/Ubuntu or panel context, example output, interpretation, use case, follow-up, privilege and safety. Probe cards and feedback link to the library. An inline lookup works in Practice on all 112 tickets; fixture command typeahead is case-specific.
- v5 local progress stores all prior Practice, Guided, review and Legacy Exam data plus separate Stateful/Objective Exam drafts and attempts. `loadProgress` migrates valid v1–v4 data without deleting older keys. Export/import accepts v1–v5 JSON. History keeps old aggregate Guided scores even when per-question results were not recorded. `Completed` means submitted; `Mastered` now requires a separately authored scenario variant after delay, so repeating the same Guided questions no longer grants it.
- Exam is available on every original ticket. It hides hints, terminal command suggestions and the answer until submission; non-shell PANEL/BILLING/BACKUP LOG tasks are shown as available actions so learners do not have to memorize a synthetic task string. The learner must inspect both authored source probes and write symptom, hypothesis, evidence, safe action and verification. It saves an immutable submitted note and later rubric self-score. Exam does not automatically grade prose or claim independent competence.
- Shared UX for all 112 tickets has larger text, compact L0 form, inline command lookup, typeahead, clear overall progress and a remembered last ticket. The legacy answer now requires both authored probes for new attempts; prior revealed progress remains accessible.
- Guided content audit for all 12 cases is in `Milestone_2_Content_Audit.md`. The DNS typo case includes the customer's exact hostname; probe context (client/guest/panel) is labeled. Empty journal output and terse source fixture lines are not treated as a complete root cause.
- Answers and hints are split from initial public case payload by the preparation scripts. This is a UI learning barrier, **not security** against someone reading the local build files directly.

### Implementation map

| Area | Source of truth / entry point |
|---|---|
| Original 112 tickets and schema | `starter-data/tickets.json`, `starter-data/ticket_schema.json`, `scripts/prepare-data.mjs` |
| Authored Guided content | `scripts/guided-content.mjs` |
| Guided validation and public/answer split | `starter-data/guided_schema.json`, `scripts/prepare-guided.mjs` |
| Guided UI and stage/command logic | `src/guided/GuidedWorkspace.tsx`, `src/guided/engine.ts`, `src/guided/types.ts` |
| Command docs and UI | `src/guided/commands.ts`, `src/guided/moreCommands.ts`, `src/guided/CommandLibrary.tsx` |
| Review and mastery | `src/guided/review.ts`, `src/guided/ReviewWorkspace.tsx` |
| Exam flow and readiness | `src/ExamWorkspace.tsx`, `src/exam.ts` |
| Navigation, filters, legacy workspace, history, import/export | `src/App.tsx` |
| Persistence and migration | `src/storage.ts`, `src/types.ts`, `src/lib.ts` |
| Generated public material | `src/data/tickets-public.json`, `src/data/guided-public.json`, `public/answers/`, `public/hints/`, `public/guided-feedback/`, `public/guided-hints/` |
| Verification | `src/lib.test.ts`, `src/guided/engine.test.ts` |

Do not hand-edit generated JSON in `src/data/` or `public/`; edit the source fixtures or `scripts/guided-content.mjs`, then run `npm run prepare-data`. Keep answer keys out of `guided-public.json`. When adding a probe, define the literal output and explicit accepted variants; never synthesize an output for an unmatched command.

### Verified through the 2026-10-23 expansion

- `npm run prepare-data`, `npm test -- --run`, and `npm run build` are the required checks. Automated tests cover all 12 Guided fixture/feedback references, 112 original fixtures, state-specific command matching and action gates for six cases, six-question Objective Exam grading, v1–v5 progress, Exam readiness and the rule that an identical retest cannot award Mastered.
- Browser smoke test used a separate `localhost:5174` origin: completed `VPS-01-001` with two deliberately wrong answers; saw 4/6 objective score and two Review Mistakes; a short retry corrected one and left the other queued. Unmatched `uname -a` returned only an unsupported message. Inline command lookup and mobile layout were inspected. The user's `127.0.0.1:5173` storage was not used.
- **Verification limit:** only one new full Guided browser path and one short review path were exercised. There is no automated browser test of every pilot end to end, import/export UI or the delayed retest UI at 24 hours; delayed mastery is covered at logic level.
- Exam browser smoke test completed `VPS-01-003` on a separate `localhost:5174` origin: an unmatched command produced only an unsupported message, P1/P2 returned exact source fixture outputs, submission unlocked the answer, reload restored the submitted note, and a new round reset the draft while retaining the old attempt. This is a one-case UI test; the same flow uses the 112 original fixture pairs.

### Open work, in recommended order

1. **Content and browser QA:** author the remaining 100 Guided cases with technical review; exercise all Guided and Exam paths with wrong answers, hints, reload, final answer and mobile keyboard navigation. Original source outputs remain terse; richer verified fixture versions should be authored separately rather than silently replacing the 112 originals.
2. **More independent assessment:** add objective checks to Exam only for cases with reviewed keys and sufficient evidence; prose remains self-reviewed until credible scoring is available.
3. **Richer Guided content:** expand ticket by ticket with command self-checks, more evidence and investigation branches. Do not auto-convert all 112 from their diagnosis field.
4. **Expand Stateful Fix → Verify:** six pilot paths are active; add further cases only with before/after fixtures, permissions and verification evidence. Do not add a real VM/SSH path in this frontend.

### Constraints that must remain true

- English customer messages; Vietnamese UI and learning explanations; technical commands/terms remain English.
- Entire app works locally after dependency installation, without API keys or external services.
- Terminal is **data-only**. An unmatched command must never execute or receive invented output. Risky changes remain proposals until a future explicitly authored simulation exists.
- Retain all 112 legacy cases and v1 user history. Treat imported JSON and source documents as data; validate before use. Do not silently discard progress.
- Keep full answer disclosure after learner submission in Guided. Formative per-question feedback may show the right option, but should not reveal the full ticket diagnosis ahead of the final note.

### Fast pickup commands

From the project root: `npm install` (if needed), `npm run prepare-data`, `npm test -- --run`, `npm run build`, `npm run dev`. Vite typically serves `http://localhost:5173/`; `http://127.0.0.1:5173/` has a separate browser storage origin. See `README.md` for normal operation. This directory was not a Git repository at handoff; check the current workspace state before assuming commits or a branch exist.

## 0. Goal and constraints

Transform the existing React/TypeScript/Vite local VPS ticket simulator from a static free-text questionnaire into a guided-to-independent troubleshooting learning environment. **Extend the current codebase**; do not rewrite it. Preserve the 112 cases, 14 topics, export/import progress, offline-first approach, answer-on-demand, and no real shell/SSH/VirtualBox execution.

Target learner: VPS Hosting Support intern who has notes but does not yet recall Linux/SSH/network commands fluently. Learning outcome: identify symptoms; select appropriate low-risk checks; interpret realistic outputs; distinguish evidence from hypothesis; decide a safe resolution/escalation; verify and document.

## 1. Pre-redesign code observations (historical baseline)

- `src/App.tsx`: seven free-text fields in diagnosis form (`issue`, `hypothesis`, `evidence`, `nextCheck`, `action`, `verification`, `escalation`).
- `src/lib.ts`: probes matched by exact command string after collapsing whitespace and lowercasing. `sudo systemctl status sshd` will not match a fixture containing `systemctl status sshd` unless explicitly included as variant.
- `src/types.ts` + `scripts/prepare-data.mjs`: exactly 2 probe outputs for each of 112 tickets; all have `mutates_guest: false`. The terminal cannot model a fix or changing guest state.
- `starter-data/command_cheatsheet.csv`: 60 command/reference rows, not integrated into App/terminal UI. Case probes contain ~186 distinct literal commands; only ~13 exact strings overlap cheatsheet (this is an exact-string count, not a semantic coverage measure).
- `src/App.tsx`: answer unlocks after *only* nonempty hypothesis. Self-assessment checkboxes calculate 0–10; no automatic correctness scoring. Any saved attempt counts as complete.
- Dataset: L0–L3 each have 28 tickets, but all levels have 2 observations; the customer descriptions average ~18 words and probes ~7–8 words of output. Complexity progression is primarily topic, not investigation depth.
- Keep current positive properties: no actual command execution, answer fixtures separate from initial public ticket payload, progress stored locally with export/import, replay/history functionality.

## 2. Product principles

1. **Learning scaffolding:** worked example -> guided decision -> independent retrieval -> realistic incident response. Support fades as competence improves.
2. **Meaning before syntax:** teach what a command checks, why it is selected, and what output means before asking for verbatim memorization.
3. **Evidence before resolution:** distinguish symptoms, observations, possible causes, confirmed root cause, proposed changes, and verification.
4. **Mistakes with feedback:** when wrong, give an explanation and one targeted micro-lesson, not only a red X.
5. **Operational safety:** every action has a risk label and required authorization; no production operations or remote shell execution.
6. **Honest simulation:** unsupported commands must not be called “wrong”; cases without enough evidence must allow “cannot conclude yet.”
7. **Realistic but readable:** console-style output plus a short learning explanation in learner's language.

## 3. Primary screens

### A. Dashboard / Learn
- Continue learning, recommended next case, review weak skills, recent score trend, topic explorer.
- Separate `Completed` from `Mastered` (e.g., successful unassisted retest after delay).
- Optional learning track by skill family (SSH, Network, Services, Disk, etc.).

### B. Ticket workspace — stepper with 5 steps
1. **Triage:** read customer message; choose main symptom (single-choice), scope (multi-choice), what is still unknown. No root cause in title or visible tags in Exam mode.
2. **Investigate:** choose category of next check, then command; show contextual command explanation on demand; simulate output. Evidence gallery with pin/annotate output. Add `Ask customer` / `Open panel` actions only where supported.
3. **Interpret:** quiz about actual output (`inactive (dead)` means what?), choose supported evidence and distinguish hypothesis vs fact.
4. **Decide:** choose next action(s) (fix, further check, escalation) and justify safety. For the initial version, actions can remain proposals; later add controlled simulated state transitions.
5. **Verify & document:** select verification checks and produce a short 2–3-line internal note (long form optional), then feedback and score breakdown.
- Sticky compact progress tracker, `Need a hint?` with tiers, `Command glossary` drawer, `Back`/`Continue`.

### C. Command Library
- Search by symptom, command, topic, OS, and safety level.
- At minimum each item: `id`, command family, purpose, parameters/flags, safe read vs config-change, privilege, CentOS vs Ubuntu syntax, example output, interpretation, common pitfalls, related tickets, follow-up command, short self-check quiz.
- Connect command cards to ticket probes by stable `command_id` (avoid raw-string-only joins).
- Start with 25–35 core commands, review carefully; then migrate all existing 60 cheatsheet commands and fill gaps.

### D. Review / My mistakes
- Cards for missed diagnosis, incorrect interpretation, wrong command selection, unsafe action, uncertain root cause.
- Retry as short contextual question, later retest as unassisted ticket.
- Keep user-specific weak concepts rather than counting only completed tickets.

## 4. Three help modes (independent of case difficulty)

| Mode | UI and question formats | Terminal |
|---|---|---|
| Guided / Learn | 1 worked example, MCQ, multi-select, order steps, evidence selection, short explain | Suggested commands with tooltips, flags explained |
| Practice | Less revealing hints, pick/check command + one short free response | Search/filter command library; type or choose; partial clue if unmatched |
| Exam / Work simulation | Hide topic/root cause, no hints by default, realistic ticket note, no answer until submitted | Free command entry with normalized vetted aliases; safe handling of unsupported commands |

Do NOT define a fixed MCQ percentage as a proven educational rule. The assisted/unassisted mix should be configurable and respond to demonstrated competency.

## 5. Question types to implement

- `single_choice`: identify main symptom/cause candidate.
- `multi_select`: select checks/evidence supported by the current outputs.
- `step_order`: arrange investigation sequence (e.g., service status before configuration changes).
- `command_choice`: choose a command **for a stated purpose**, not only its syntax.
- `output_interpretation`: select correct meaning of the output (immediate feedback and explanation).
- `evidence_selection`: select the observations that support or rule out a hypothesis.
- `short_answer`: one or two sentences; voluntary, rubric/self-review for offline MVP.
- `ticket_note`: end-of-case structured optional free text; compare against an example.

Wrong-answer feedback must include why wrong and why correct, with link to a relevant command/concept. Don't disclose the full final root cause too early. Include "Insufficient evidence yet" on ambiguity cases.

## 6. Data schema — proposed version 2 (design reference)

Keep existing ticket fields and add the following new entities. Examples are schematic, not a strict complete TS schema:

```ts
type CommandDoc = {
  id: string; family: string; name: string; purpose_vi: string;
  syntax: Record<'centos'|'ubuntu', string[]>;
  flags: { flag: string; meaning_vi: string }[];
  privilege: 'user'|'sudo'|'host-admin';
  safety: 'read'|'privileged_read'|'changes_guest'|'destructive';
  expected_outputs: { output: string; interpretation_vi: string }[];
  when_to_use: string[]; pitfalls: string[]; related_ticket_ids: string[];
};

type ProbeV2 = {
  id: string; command_id?: string;
  input_variants: string[];      // whitelisted accepted syntactic variations
  context: 'client'|'guest'|'host'|'panel'|'billing'|'backup';
  required_state?: string[];
  output: string; explanation_after_use?: string;
  evidence_tags?: string[];
};

type QuestionV2 = {
  id: string;
  stage: 'triage'|'investigate'|'interpret'|'decide'|'verify';
  kind: 'single_choice'|'multi_select'|'step_order'|'command_choice'|'output_interpretation'|'evidence_selection'|'short_answer'|'ticket_note';
  prompt_vi: string; options?: {id:string;label:string}[];
  correct_option_ids?: string[];
  feedback_by_option?: Record<string,string>;
  explanation_vi?: string; references?: string[];
  visibility_condition?: string[];
};

type CaseV2 = {
  id: string; source_level: 0|1|2|3; primary_topic: string; secondary_topics?: string[];
  customer_message: string; context: Record<string,string>;
  probes: ProbeV2[]; questions: QuestionV2[];
  hints: {level:1|2|3;text_vi:string}[];
  findings: {symptoms:string[];evidence:string[];hypotheses:string[];confirmed?:string} ;
  resolution: {safe_steps:string[];verify_steps:string[];escalate_when:string[];warnings:string[]};
  simulation?: {state: string; transitions: {action_id:string;requires:string[];next_state:string}[]};
};
```

Implement JSON Schema validation with AJV for added entities. Add stable IDs and data versioning. Migrate existing localStorage v1 progress to v2 (do not silently discard learner history).

## 7. Virtual terminal: specific behavior

- Parse only controlled commands with a whitelist/grammar; do **not** execute any OS command or `eval`.
- Normalize harmless whitespace; match explicit semantic variants/aliases (`sudo systemctl status sshd` vs `systemctl status sshd`, when privileges permit). Preserve distinction between different flags/targets where they materially change output.
- Provide typeahead (`systemctl st...` -> command options) and a quick `Why use this?` icon.
- Distinguish feedback classes: `Recognized and available`, `Known command but no simulated data for this case`, `Syntax unclear`, `Action restricted for safety`.
- Let learner view command explanation without awarding probe correctness. Warn when attempting risky actions without authorization.
- For a given case, allow more plausible probes than the 2 minimum and model both useful and non-useful tests.
- Later: state machine for safe simulation of `systemctl start sshd`, then refreshed `systemctl status sshd` and connection check. Do not fake success without running the simulated verification.

## 8. Example redesign: SSH `Connection refused` (VPS-01-001)

**Triage** (single-choice): What does the customer report?
- A. Authentication denied
- B. TCP connection refused **(correct)**
- C. DNS NXDOMAIN
- D. Host key changed

**Choose check** (command-choice): What would you check first in guest console?
- A. `systemctl status sshd` **(good first check)**
- B. `df -h` (valid tool, less directly relevant)
- C. `dig example.com` (not indicated)

**Run command**: `systemctl status sshd`
```
● sshd.service - OpenSSH server daemon
     Loaded: loaded (...)
     Active: inactive (dead)
```
**Interpret** (single-choice): What does `inactive (dead)` mean? Correct: sshd is not running now. Do not claim root reason is known.

**Collect evidence** (multi-select): service inactive; no listener on TCP/22. The customer panel says VM running, but that does not confirm SSH running.

**Decide** (step-order or multi-choice): check `journalctl -u sshd -n 50`; validate config `sshd -t` if needed; start only if authorized; test port and SSH login from client.

**Document** (short-answer): 2–3 lines on finding / action / verification. AI grading is optional; offline self-review against rubric first.

**Feedback**: identify unsupported conclusions and wrong-risk actions; link command cards for `systemctl`, `ss`, `journalctl`.

## 9. Scoring and progression

- Automatically grade objective questions and record per-skill outcomes; do not let self-ticked checkboxes masquerade as automatic assessment.
- For free responses in offline MVP, mark `Self review` and display comparison rubric; if adding AI grading later, clearly label it and retain non-AI fallback.
- Suggested evidence-based rubric dimensions: symptom recognition, correct next check, output interpretation, evidence-based reasoning, safe decision, verification/escalation. Include `insufficient evidence` as a correct result when appropriate.
- Track help used and independent retest separately; `Completed` ≠ `Mastered`.
- Show explanations immediately after formative micro-questions; delay the *full case diagnosis* until submission.
- Offer missed-command cards and spaced revisits (e.g., 1/3/7 days as configurable starting defaults, not a scientific guarantee).

## 10. Content-quality migration

For MVP: pilot 8–12 tickets across SSH, network, system service, disk, HTTP, DNS (not all 112 at once).
Each pilot case should have 4–8 realistic probe options; L2/L3 eventually 6–12 depending on complexity. Include outputs from client/guest/panel, non-diagnostic checks, meaningful ambiguities, customer follow-ups, and a verification-after-action fixture. Case difficulty should reflect number of interacting systems and uncertainty, not just topic.

Do not expose root cause through ticket card titles or beginner-exam metadata before answer. In Guided mode, topical classification is fine if it is a deliberate learning aid. Use CentOS Stream 9 syntax by default; show Ubuntu variants in Command Library. Add service-scope and permission context (managed vs unmanaged VPS).

## 11. UX requirements

- Desktop: ticket summary visible while investigating; stepper at top; terminal and command/context panel side by side where space allows.
- Mobile: stepper stacked; no compulsory long seven-field form; keep buttons within viewport.
- Default text ≥14px for primary prose, terminal ~13–14px, metadata ~12px; inspect actual device scale.
- Tooltips/drawers for flags, output phrases, key terms; avoid permanently expanded encyclopedic text.
- Display meaningful state after each learner action, including why an option is useful or not.
- Keyboard: Enter executes simulated probe; Tab navigation; accessible labels and focus states.
- Show `Learning objective` before Guided cases, but do not spoil case root cause.

## 12. Original delivery phases (see current-state guide above for progress)

### P0 / fastest learning value
1. 3 learning modes (or Guided mode first) + 5-step UI; reduce 7 fields to one final short note in Guided.
2. Integrate command library (seed 25–35 core commands; migrate CSV); "What does this command do?" drawer, flags, output interpretation.
3. Add 4 objective question types and immediate feedback.
4. Ensure existing 112 tickets work in a legacy mode; migrate 8–12 pilot cases to v2.
5. Fix known vs unsupported vs invalid command messaging.

### P1 / simulation quality
6. Expand pilot cases to 4–8 diverse probes, add context and evidence selection.
7. Better scoring per skill, saved weak areas, retry/review queue.
8. Create feedback on wrong decision and escalation/safety choices.

### P2 / realistic practice
9. Multi-step branching simulations with customer follow-ups and action-state transitions.
10. Realistic mixed-topic tickets and blind Work Simulation mode.
11. Optional authoring interface/import for new ticket cases and command docs.

### Later — real VM labs
Only via an isolated backend using allowlisted actions and disposable CentOS VM snapshots. No arbitrary shell access from web frontend, no production credentials, and no unattended host changes.

## 13. Acceptance criteria for first release

1. Existing 112 tickets accessible with no data loss.
2. At least 8 pilot v2 tickets can be finished without writing seven free-text fields.
3. A beginner can learn why `systemctl status sshd`, `ss -ltnp`, and `journalctl -u sshd` are chosen, with real-looking output interpretation.
4. `sudo systemctl status sshd` is accepted as a vetted variant of `systemctl status sshd` where appropriate; unsupported command does not get marked as conceptually wrong.
5. MCQ + multi-select + command-choice + output-interpretation work and provide answer-specific feedback.
6. Learner sees exactly which idea was missed and can open its command/concept card.
7. A ticket cannot be marked `Mastered` merely by revealing answer or self-ticking all checks.
8. History and progress can still export/import; v1 progress migrates to v2.
9. No real system commands execute; forbidden actions are simulated and clearly labeled.
10. Automated tests cover data validation, alias matching, step logic, objective grading, answer reveal, and progress migration.

### Acceptance status at 2026-10-22

| # | Status | Evidence / remaining check |
|---|---|---|
| 1 | Implemented, tested | 112 tickets and 224 source probe outputs preserved by automated tests; v1 migration tested. |
| 2 | Implemented, partially exercised | 8 cases pass schema/build validation and share one Guided flow; one case completed end to end in browser. Run the other 7 as a content QA pass. |
| 3 | Implemented, content review remains | Command cards, probe purpose and output meaning are present for SSH. Some fixture outputs are terse; review for learning clarity. |
| 4 | Implemented, tested | Explicit `sudo systemctl status sshd` alias and neutral unknown/known messaging; tested in engine and browser. |
| 5 | Implemented, tested | Single-choice, multi-select, command-choice, output-interpretation and option-specific feedback; engine tests plus one browser pass. |
| 6 | Implemented, browser-checked | Wrong selection explains both the error and correct idea; link opens command card. |
| 7 | Satisfied by absence of mastery feature | UI records `Completed` only. Implement a real independent retest before adding `Mastered`. |
| 8 | Implemented, partial UI QA | v1/v2 migration and round-trip storage tested. Export/import buttons exist; browser-level file round-trip remains to test. |
| 9 | Implemented, tested | Matching uses JSON fixtures only; restricted action gets a message. No execution path exists. |
| 10 | Partial | Automated content, alias, stage, grading and migration tests pass. Answer reveal was browser-checked for one case; add a focused browser test if this becomes a release gate. |

## 14. Success metrics (compare before/after)

- Guided first-ticket completion rate and time to first useful action.
- Rate of unsupported-command attempts that are actually valid syntax variants.
- Accuracy on output interpretation and command selection, initial versus retest.
- Average hint use and reported confusion during first five cases.
- Ability to solve a similar unassisted case after guided practice (stronger signal than raw completion count).


