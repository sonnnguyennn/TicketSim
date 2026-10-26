# TicketSim D3-C1 — independent source audit (2026-10-26)

## Boundary of the audit

Source archive provided for this review, HEAD reported `9e41f7b`. A full-population static inspection covered the 620 objective question entries, 112 English reference notes, 393 Guided probes, and 122 effective Command Library records/metadata. Targeted manual semantic inspection covered selected high-risk incident paths and command examples. **This is not a human/manual semantic verification of all 620 questions or a distro/version-specific lab validation of all 102 shell entries.** The two screening CSV files list all items without falsely marking them SME approved.

Agent D3-C1 report: 325 retained, 6 editorial revised, 5 needs external review, 284 L0/L1 pending; see original `audit/phase-d3/09_D3_C1_Editorial_QA.md`.

## Population-wide findings

- 620 distinct question prompts, not equivalent to good distractor quality.
- 224 questions have at least one wrong option with an absolute/obviously bad action cue, and 0 correct labels use those cues in the exported dataset. Redesign as plausible nearby decisions where appropriate; L0 distractors need not all be difficult.
- 176 questions have the correct option as strictly longest (screening statistic, not proof of flawed question).
- 11 questions flagged for suspected joined technical quantities/words (inspect authoring source and generated option feedback).
- 112/112 English reference notes have Issue / Findings / Next Action / Verification / Status headings, but this is a **format check only**, not a guarantee of accuracy or naturalness.
- 21 of 122 Command IDs are not referenced by initial Guided probe IDs; these are not necessarily redundant and may be intentionally included as reference or change actions.
- 104/122 entries have only one usage example, 18 have two. Of 102 shell cards, **101 repeat exactly the same command in the title, syntax field and first example**; the separate `proves` field duplicates `interpretation` for all 102 shell entries. The current UI hides some of that legacy data, but its title, syntax block and first example still repeat the same shell string. Complex command families need use-case review; count alone does not mandate additions.
- 71 shell records have `SOURCE_VERIFIED`, 31 have `PENDING`, 20 support actions have `INTERNAL_SOP_REQUIRED` metadata. All 122 have no recorded lab validation.
- `panel-probes` is linked from 55 Guided probes. Generic provider tasks require clearer context so simulated labels are not mistaken for a real vendor panel API.

## Confirmed/prioritized findings

| ID | Severity | Target | Finding and required action |
|---|---|---|---|
| A01 | Major, scenario consistency | VPS-14-006/output, decision, note | Deletion scheduled for 25 Oct 2026; when studied 26 Oct 2026 with no explicit incident time, actions saying *before deadline* can mislead. Specify historical incident timestamp, or model states after deadline; confirm whether deletion actually occurred rather than assuming. Source `scripts/content/phase-b-11-14.mjs` and generated P2/G1. |
| A02 | Major, assessment design | 224 of 620 questions flagged | Overusing conspicuously unsafe/absolute wrong answers trains elimination shortcuts. Examples: VPS-04-004, VPS-05-005, VPS-13-008. Replace with technically plausible alternatives and explain why the chosen check is best given current evidence; don't force ambiguous keys. |
| A03 | Minor, editorial | VPS-04-004/output | `wa76%` and `khoảng180ms` are joined. Rewrite to `wa = 76%`, `await ≈ 180 ms`; also explain iowait as CPU waiting for I/O, not 'disk failure'. `scripts/content/phase-b-01-05.mjs:459` per ledger. |
| A04 | Minor, editorial | VPS-05-003/output, VPS-05-005/output, VPS-05-008/output | `Journal8G`, `dùng94%`, `vda40G`, `vda1 ... /20G`, `VG còn49.99g`: normalize typography and units throughout actual generated prompt/options/feedback. Some rows were marked AGENT_REVIEWED. |
| A05 | Minor, editorial | VPS-06-002/output, VPS-04-006/check | `hoàn thành72%`, `PID1200` without spacing; replace with `hoàn thành 72%`, `PID 1200`. |
| A06 | Needs evidence | VPS-01-008/check, VPS-04-008/check, VPS-09-007/check | Commands/fixtures with incident UTC but journal display not pinned to UTC. `--utc` affects rendering; ensure source parities by adding authored Guided-only probe with documented reason, or explicitly model host timezone in case context. Do not silently change original source probe fixture. |
| A07 | Major pending factual state | VPS-14-006/output, decision | 'Expired' / 'deletion scheduled' / 'hold false' do not establish that storage still exists after the scheduled time. Verification and escalation must be conditioned on actual deletion job state. |
| A08 | Minor, example fidelity | Command Library nc-port, iostat, vmstat | Ncat/netcat variants, device stats and first sample behavior differ by implementation/version/time. Their metadata remains PENDING; current docs acknowledge limits, but printed examples must be labeled sample version or excerpt, and lab examples pinned before trusted as universal output. |
| A09 | Minor, course information architecture | Command Library 21 unused IDs, 20 support tasks | These aren't automatically extraneous; surface 'read-only checks', 'change actions' and 'provider workflows' separately. Avoid mixing simulated actions with real shell commands. |
| A10 | Minor, editing | English note and Command Library | The UI now has a coherent model with flexible sections; **101/102 shell cards** repeat the same command as title, syntax and first example; collapse to one displayed command when the three match. Legacy `whenToUse` versus example-purpose are filtered using exact-string equality rather than semantic equivalence, so repetitive prose can still appear. The underlying `proves` and `interpretation` are identical in all 102 shell records; remove redundant authoring representation or derive one from the other after migration. Review reader-visible content, not only JSON lengths. |

## Technical references and verification limits

- Upstream sysstat `iostat(1)` documents first report since boot unless `-y`, extended stats with `-x` and inactive-device suppression with `-z`: https://github.com/sysstat/sysstat/blob/master/man/iostat.in
- procps-ng `vmstat(8)` documents first sample averages since reboot and later interval samples: https://man7.org/linux/man-pages/man8/vmstat.8%40%40procps-ng.html
- systemd `journalctl` documents display in UTC using `--utc`, and `--since`/`--until` date-time syntax: https://www.freedesktop.org/software/systemd/man/latest/journalctl.html
- firewalld `firewall-cmd` documents default vs active zones: https://firewalld.org/documentation/man-pages/firewall-cmd.html
- Nmap Ncat docs show package-dependent options/format: https://nmap.org/book/ncat-man.html

None of these references certifies a particular customer VM command output or GreenCloud internal SOP.

## Prioritized execution

1. Fix **A01/A07** incident timeline and **A06** timezone/evidence consistency, preserving original source tickets and progress.
2. Correct typographic defects **A03–A05**, add a lint regression rule that catches joined units/keywords in *generated* content.
3. Refactor assessment distractors in high-risk L2/L3 first. Preserve plausible alternatives and require question prompt to say *best next check* when needed. Ensure old attempt history isn't silently regraded on answer changes.
4. Build a command-level verification ledger with per-field statuses for syntax, options, sample output, explanation, safety, distro; prioritize 31 pending and high-impact `nc`, `iostat`, `vmstat`, `ssh`, `journalctl`, `systemctl`, `ip`, `ss`, `firewall-cmd`. Do not stamp all 71 existing SOURCE_VERIFIED entries as expert-approved.
5. After quiz and command remediation, use new blind-case tests and at least one disposable CentOS/Ubuntu lab for candidate read-only commands. Any provider action needs internal SOP approval before claiming production applicability.

**No runtime source was modified by this audit.**
