# D3-C2 — content and technical editorial review

Baseline: `9e41f7b` (D3-C1). Source of truth: `scripts/guided-content.mjs`, `scripts/content/phase-b-*.mjs`, `scripts/guided-reference-notes.mjs`, and `src/guided/commandKnowledge.ts`. The three independent audit inputs are preserved in `inputs/`. The ledgers can be rebuilt with `node scripts/export-d3-c2-review.mjs` after `npm run prepare-data` and `node scripts/export-d3-assessment.mjs`.

| Population | Agent reviewed | Changed against baseline | Unchanged | External approval |
|---|---:|---:|---:|---|
| Guided objective questions | 620 | 73 | 547 | SME pending for all |
| Command Library cards | 122 | 1 (`iostat`) | 121 | SME and lab pending |
| English reference notes | 112 | 11 | 101 | SME pending for all |

The question count covers all 336 L2/L3 and 284 L0/L1 questions, including prompt, options, correct key, per-option feedback, related probe, hint, and final guidance. It is an agent semantic review, not independent expert approval. No answer keys, question IDs, command IDs, or original ticket IDs changed. The 73-question count includes editorial text and feedback changes, not 73 grading changes. The 112 notes were read for issue/findings/next action/verification/status and evidence scope.

The highest-impact corrections concern the historical deletion deadline in VPS-14-006, UTC log display in three cases, an ambiguous VPS-04-006 question, the scope of the VPS-01-008 OOM check, and the Guided tracepath PMTU example in VPS-02-008. The latter remains an authored fixture pending lab replay. English notes were adjusted where they claimed more than the probes support. The Command Library UI now suppresses repeated title/syntax/first-example text. `iostat` teaches `-y` for interval-only output without promoting the whole card to source verified.

Source metadata remains **71 SOURCE_VERIFIED, 31 PENDING, 20 INTERNAL_SOP_REQUIRED**. Every card is `LAB_PENDING`; all 20 provider/support tasks are `SOP_PENDING`. The 21 commands without direct Guided probe links are evaluated in the coverage report, not removed. The 224 distractor-cue and 176 correct-longest screening signals were inspected in context; they are not defect counts. Four high-risk L2/L3 cases received more plausible wrong answers with distinct feedback; A02 remains open for independent difficulty review of retained cues. No claim is made that the 620 questions or 122 cards have SME approval.

See `04_Technical_Findings.csv` for finding status, `05_Before_After_Examples.md` for concrete changes, `08_Regression_QA.md` for executed checks, and `09_Remaining_Risks.md` for limits.
