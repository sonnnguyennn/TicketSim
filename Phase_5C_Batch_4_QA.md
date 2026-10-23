# Phase 5C — Batch 4 QA (2026-10-23)

## Scope

Added Guided `VPS-06-001`–`008` and `VPS-10-001`–`008`: **72/112** total, 18 cases at each L0–L3. The cases separate guest observations from provider panel and libvirt host evidence, require approval for lifecycle or credential changes, and escalate host, storage or control-plane work. No VM, host, SSH or shell operation is executed. `VPS-06-004` stops before reinstall because the main disk would be overwritten without a recent backup. `VPS-06-008` does not use a hard stop. L2/L3 have two additional investigations and gated interpretation.

Guided-only overrides replace source text that reads like commentary rather than literal stdout: `VPS-06-002` (`top`), `VPS-10-005` (`virsh domblklist`), `VPS-10-006` (`stat`) and `VPS-10-008` (`timedatectl`, `date -u`). Original ticket probes are unchanged. Six command cards were added for fstab, reinstall confirmation, domblklist, stat and guest time checks; library count is **102**. Guided now labels hypervisor output separately in the UI and stores panel/host readings as investigation entries.

## Verification performed

- `npm run prepare-data`: 112 source tickets and 72 Guided prepared; schema and fixture checks passed.
- `npm test -- --run`: 20/20 passed, including all authored case paths, answer feedback, command matching, source preservation, Guided overrides and v1–v5 progress tests.
- `npm run build`: passed (`tsc -b`, Vite). Chunk-size warning remains.
- `npm run test:browser` with Microsoft Edge through `PLAYWRIGHT_CHROMIUM_PATH`: 10/10 passed. New browser path checked `VPS-10-005` hypervisor label and literal `domblklist` output. Existing tests cover desktop/mobile, keyboard, migration, export/import, Mastered delay, Guided probe gating and command lookup.

## Limits

Panel/host metrics are authored snapshots. They do not prove root cause without timestamp, scope and follow-up evidence. No Stateful, Objective Exam or independent review variant was added: **6/112 each**. Only one Batch 4 browser path was exercised; the full 16-case technical review still depends on fixture and key inspection plus unit coverage, not a 16-case end-to-end browser run.
