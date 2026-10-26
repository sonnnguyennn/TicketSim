# Phase D2.2 — editorial batch 1 and UI integration QA

## Scope and source

The supplied editorial patch was checked against the clean `66e8734` HEAD and applied without conflict. Its reverse check still succeeds. It changes five authored files: `scripts/content/phase-b-11-14.mjs`, `scripts/guided-reference-notes.mjs`, `src/guided/commands.ts`, `src/guided/commandKnowledge.ts`, and `src/guided/commandRevisions.ts`. `npm run prepare-data` regenerated the affected public Guided data and feedback. The React integration is separate from those source edits.

This batch edits one complete Docker lesson (`VPS-13-002`), seven English reference notes, and selected Command Library explanations. It is not a semantic sign-off for all 112 tickets or 122 cards. Provider-specific procedures and real CentOS/Ubuntu behavior still require the recorded SOP/lab verification.

## Implemented UI

- Guided feedback keeps choices neutral until submission. Afterward it shows overall correctness, a textual status and authored reason under each choice, including missing correct choices for multi-select. Ordered questions show both submitted and reference order with reasons. Focus moves to feedback after checking, while submitted choices stay disabled and saved attempts are retained.
- Quick Lookup names and highlights the selected command/task, exposes its selected state, and shows an example tied to that item.
- The original English `customer_message` is primary in Guided; the diagnostic `customerExplanation` is no longer an always-visible hint.
- The English model note is parsed by its five known labels, displayed as structured rows, and copied from the original string. The completion label identifies the lesson, not the customer incident.
- Command cards now read as purpose, syntax, relevant parts, examples with output interpretation, then optional notes. Support tasks retain their distinct panel/provider structure.

## Verification on Windows

| Check | Result |
|---|---|
| `npm run prepare-data` | PASS — 112 tickets and 112 Guided cases generated |
| `npm run audit:content` | PASS — 0 errors; reports 112 Guided, 122 cards, 620 rewritten question prompts |
| `npm test -- --run` | PASS — 39/39 tests |
| `npm run build` | PASS — TypeScript and Vite build; existing large-chunk warning |
| `npm run test:browser` | PASS — 47/47 tests on the final run |
| `git diff --check` | PASS |
| Editorial patch reverse check | PASS |
| Grading keys | Five changed generated feedback files retain their baseline `correctIds`; all other feedback files are unchanged |

Browser coverage includes L0 and L3 tickets, wrong and correct responses, multi-select, ordered steps, focus after checking, 390px layout, the complete `VPS-13-002` path, v5 export/import, earlier progress migrations, authored terminal output, and Guided command history. The content audit validates 112 unique Guided IDs and 122 unique command IDs. The 620 scored questions also have 620 unique ticket/question pairs. `starter-data/`, the progress schema, and the Guided scoring engine have no diff.

The first full browser run exposed three old assertions tied to the previous Library layout/phrasing. They were updated to test the same behavior; the targeted rerun passed. One later browser startup failed before tests when Windows returned `UNKNOWN` while `predev` rewrote a generated JSON file. The file remained present; the next full run passed 47/47. Browser clipboard readback normalizes line endings on Windows, so the test compares the original note after CRLF normalization while the Copy note handler writes the authored string directly.

## Visual evidence

The local screenshots are in `screenshots/phase-d2-2/` (ignored by Git). They can be regenerated through the browser tests and `node scripts/capture-d2-2.mjs <running-dev-server-url>`:

- `feedback-l0-wrong-390.png`, `feedback-multi-390.png`, `feedback-order-390.png`
- `customer-English-390.png`, `quick-lookup-1440.png`
- `systemctl-status-1440.png`, `ssh-vvv-1440.png`, `ssh-vvv-390.png`, `ip-addr-1440.png`, `support-task-1440.png`
- `VPS-13-002-summary-1440.png`, `VPS-13-002-summary-390.png`

The 390px ordered-step image was inspected after a spacing correction. The Command Library and English reference note images were inspected for hierarchy, readability, and overflow.

## Remaining boundary

This work does not expand Stateful/Exam, change the 620 question keys, regrade earlier attempts, or independently validate every technical statement in the whole library. `audit:content` is a structural/content consistency gate, not proof of lab or source verification for each command.
