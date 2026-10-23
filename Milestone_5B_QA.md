# Milestone 5B QA — 2026-10-23

## Scope and evidence

- Six Stateful pilots now have an authored independent review scenario: VPS-01-001, VPS-02-001, VPS-03-001, VPS-05-001, VPS-05-004, VPS-08-003. Each uses a different customer situation, authored evidence and three fresh objective questions. Answer keys are generated separately under `public/review-feedback/`.
- `Mastered` requires the latest Guided attempt, a review submitted at least 24 hours later, the matching authored variant ID and every variant answer correct. A short mistake retry or repeated original questions cannot grant it. Other Guided cases remain Completed until a variant is authored.
- Browser QA used isolated Playwright contexts at 1440×900 and 390×844, checked the ticket list, keyboard Tab/Enter navigation, Command Library, Guided layout and horizontal overflow. The mobile Guided screenshot was inspected visually. The browser suite also exercised a nonempty v5 draft export/import, refresh, v1 migration with the original key retained, and delayed variant completion through the UI.

## Checks

| Check | Result |
|---|---|
| `npm run prepare-data` | 112 original tickets and 12 Guided prepared |
| `npm test -- --run` | 18/18 passed |
| `npm run build` | Passed |
| `npm run test:browser` | 5/5 passed, Chromium 1208 via `PLAYWRIGHT_CHROMIUM_PATH` |

The first browser run exposed a test navigation mistake after refresh; the test was corrected and rerun. No app data was reset. Browser QA covers the named flows, not every device, assistive technology, or all 112 end-to-end paths. There is no real VPS or shell execution.
