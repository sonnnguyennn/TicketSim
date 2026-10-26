# D3-B — Editorial Batch 01 integration and review preparation

## Baseline and patch

- Starting HEAD: `027936f`; working tree was clean before the D3-B work. The earlier `TicketSim_Editorial_Batch1` files were from D2.2 and were not applied in this phase.
- Source: `TicketSim_D3_Editorial_Batch01.patch` and `EDITORIAL_BATCH01_HANDOFF.md` from `TicketSim_D3_Editorial_Batch01_Source.zip` supplied on 2026-10-26.
- `git apply --check` passed on the D3 patch. After applying it, all four patched source files matched the ZIP source after line-ending normalization. `git diff --check` passed.
- Scope: five scored questions in four tickets; `firewall-list`/`firewall-zones` knowledge and the firewalld example. No source ticket, fixture, key, question ID, option ID, scoring engine, or progress schema edit was requested or made.

## Content and compatibility checks

The five edited questions are `VPS-03-001/triage`, `VPS-05-002/output`, `VPS-05-002/evidence`, `VPS-07-001/evidence`, and `VPS-10-008/output`. Each generated feedback file retains its baseline `correctIds` and option ID set. Both keyed and unkeyed options have authored feedback. Four public question records changed option wording; `VPS-05-002/evidence` changed feedback only.

Compared with `027936f`, generated Guided data retains 112 case IDs, all 620 scored question identities, stages, kinds, answer gates, option IDs, and every Guided probe/output. `starter-data/tickets.json`, `src/storage.ts`, and `src/types.ts` have no diff. Existing v5 attempts therefore retain their IDs and scores; this batch does not regrade old attempts.

The firewalld card now says `firewall-cmd --list-all` without `--zone` reads the default zone; support must use `--get-active-zones` and a relevant `--zone=ZONE --list-all` before interpreting traffic for an interface/source. The example describes its zone precondition. These are teaching and metadata corrections, not a lab run.

A focused browser check found that the simplified Command Library UI displays structured options, while the patch's clearest `--get-active-zones` instruction was only in a legacy `flags` field. The `firewall-list` structured option text now carries that instruction and a tested browser check confirms it is visible. This is an integration correction to the same card; its source-verification label was not raised.

## Command metadata

The effective source and regenerated D2 ledger agree: 122 cards = 102 shell + 20 support tasks; 71 `SOURCE_VERIFIED`, 31 `PENDING`, 20 `INTERNAL_SOP_REQUIRED`, 0 `LAB_VERIFIED`. `getent-passwd` had already changed to `SOURCE_VERIFIED` before D3-B; the old D2 ledger still recorded `PENDING`. Regeneration reconciles that row and source line locations. Historical D2 QA retains its original 70/32/20 snapshot; README and ROADMAP give the current figures.

## Editorial review ledgers

- `06_Question_Editorial_Status.csv`: 620 rows, all `SME_PENDING`. It records triage labels, authoring source, current content hash, reviewer, reason, evidence, reviewed version/date, and whether a prior review is stale. Exactly five rows are marked `D3_EDITORIAL_BATCH01` as an integration marker, not SME approval.
- `07_Command_Expert_Review.csv`: 122 rows with effective syntax, structured flags, examples, output, interpretation and limits, safety, privilege, CentOS/Ubuntu fields, source URLs, source/lab/SOP verification, content hash, seven review dimensions, and reviewer evidence fields. All 122 remain `SME_PENDING`; two firewalld rows carry the integration marker. The exporter copies source verification metadata and refuses a D2 ledger mismatch; it does not infer verification from a URL.
- `scripts/write-d3-review-ledgers.mjs` preserves existing reviewer decisions when refreshed and marks a decision stale if the authored content hash changes. It requires reviewer, reason, evidence, and reviewed version before accepting a non-pending status.

## Verification

| Check | Result |
|---|---|
| `npm run prepare-data` | PASS — 112 original tickets and 112 Guided cases |
| `npm run audit:content` | PASS — 0 errors, 620 scored prompts, 122 cards |
| `npm test -- --run` | PASS — 39/39 tests |
| `npm run build` | PASS — existing large chunk warning |
| `npm run test:browser` | PASS — 48/48 on final full rerun; includes wrong/correct feedback, multi-select, step order, 390px, full topic paths, firewalld lookup, and v5 import/export |
| Focused firewalld browser check | PASS — 1/1 after structured-option correction |
| Direct baseline comparison | PASS — five feedback edits; keys, IDs, Guided fixture outputs and progress source unchanged |
| `git diff --check` | PASS |

The first final browser attempt stopped before executing tests when Windows returned `UNKNOWN` while `predev` rewrote `public/guided-feedback/VPS-10-008/output.json`. The file was present afterward; a complete rerun passed 48/48. The earlier focused firewalld test initially failed because `--get-active-zones` was hidden in a legacy field; its revised structured option passed the focused rerun and the final suite.

## Further review

The D3-A `KEEP` label remains an automated triage result. It does not approve 568 currently unflagged questions; the changed heuristic counts are 6 distractor and 46 feedback candidates. All 620 questions need an independent semantic decision. The earlier finding `VPS-04-008` text “quanh02:00UTC” remains a concrete clarity candidate outside this five-question patch.

For Command Editorial, 31 source-pending shell cards still need manual/version review; 102 shell cards still need output/exit-status lab checks if they are to be used as operational references, and 20 support tasks require provider SOP/owner validation. Source verification for firewalld does not certify every example or production behavior.
