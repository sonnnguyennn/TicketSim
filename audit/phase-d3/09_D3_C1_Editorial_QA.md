# D3-C1 editorial QA — 2026-10-26

## Scope and decision labels

The review uses the effective 620-question export in `03_Content_By_Topic`, the authored Guided source, customer context, all ticket probes, output meanings, options, feedback, hints and final diagnosis. `AGENT_REVIEWED` means an agent read the case and retained the scored question after comparing its key with the available evidence; it is **not SME approval**. `EDITORIAL_REVISED` records a scored-question wording or feedback change. `NEEDS_EXTERNAL_REVIEW` keeps an unresolved technical limitation visible. All 284 L0/L1 questions remain `SME_PENDING` until separately reviewed.

## Group 1 — topics 01–07, 28 tickets, 168 scored questions

| Outcome | Questions |
| --- | ---: |
| Agent reviewed and retained | 161 |
| Editorial revised | 5 |
| Needs external review | 2 |
| Changed answer keys or question IDs | 0 |

Each row in `06_Question_Editorial_Status.csv` has a reason, P1/P2 evidence, reviewer, review date and content hash. The five `EDITORIAL_REVISED` rows are `VPS-02-006/output`, `VPS-03-005/check`, and `VPS-04-008/{triage,output,evidence}`. The `VPS-04-008/check` prompt was also edited for spacing but remains `NEEDS_EXTERNAL_REVIEW` because of the UTC display question. `VPS-01-008/check` is the other timezone review item. The remaining 161 retained questions were checked against their case evidence; the retained label is an agent judgment, not an automated `KEEP` promotion.

### Significant before/after findings

| Item | Before | After / reason |
| --- | --- | --- |
| `VPS-02-006/output` | “Đường từ nguồn đo có loss” could imply TCP/SSH packet loss from ICMP samples. | The key now says 25% **ICMP responses missing at the destination** and asks for TCP/SSH measurements from the affected source. The Singapore TCP probe follows a different path. Key ID unchanged. |
| `VPS-03-005/check` | “Muốn xem myapp fail do điều kiện phụ thuộc hay lỗi riêng” could also be answered by `journalctl -u myapp`; its distractor feedback dismissed that useful log. | The prompt now asks for the **current unit state with recent startup events**, making `systemctl status myapp` the unique best answer. Feedback acknowledges `journalctl` as a useful follow-up. Key ID unchanged. |
| `VPS-04-008` | “quanh02:00UTC”, “vda95ms”, and similar joined time/unit strings. | Authored source now uses “quanh 02:00 UTC”, “vda 95 ms”, and spaced event times. Correlation with backup remains explicitly short of causation. |

### Technical limits requiring review

- `VPS-01-008/check` and `VPS-04-008/check`: `journalctl --since/--until` uses dated UTC input in the existing fixture command, but the command omits `--utc` for displayed timestamps. The output should not be assumed to display UTC on a host with another timezone. A proposed `--utc` edit broke the exact original-ticket probe parity test, so it was reverted. These rows remain `NEEDS_EXTERNAL_REVIEW`; the fixture and ticket source were preserved.
- The source question IDs and all 620 answer-key arrays match HEAD `3dd4bd7`. No source ticket, fixture, v5 progress schema, Stateful or Objective Exam engine was edited.

### Group 1 validation

| Check | Result |
| --- | --- |
| `npm run prepare-data` | PASS, 112 tickets and Guided cases; first retry resolved a transient Windows file-open error |
| `npm run audit:content` | PASS, 0 errors; 112 Guided cases and 122 cards |
| `npm test -- --run` | PASS, 8 files / 39 tests. The first run caught the rejected `--utc` probe change; full rerun passed after reverting it. |
| `npm run build` | PASS; existing large-chunk warning |
| `npm run test:browser` | PASS, 48 tests. Includes correct/incorrect feedback, hints and ordered choices, Command Library lookup, all 14 representative topic paths, v5 export/import and v1–v4 migration, and unmatched-command behavior. |

The browser suite exercises representative paths, not all 336 question branches. The ledger is an editorial decision record, not evidence of an independent SME or live system test.
