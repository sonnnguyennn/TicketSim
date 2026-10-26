# D3-A — Guided assessment audit

## Scope and method

Read-only export from authored Guided content at HEAD `be97c33`. Covers 112 tickets, 122 Command Library IDs, 620 scored questions, and 112 English reference notes. The 112 short-answer notes are excluded from the scored-question count.

The labels below are **deterministic editorial triage**, not case-by-case technical certification or SME approval. `KEEP` means no rule below fired; it does not establish that the key, distractors, evidence, or command semantics are correct. All 620 entries remain `SME_PENDING`. The full dataset gives the reviewer the exact prose, options, keys, probes, hints, final context, and authored source.

Prior context: Phase C recorded 620 question reviews (612 `REVIEWED`, 8 then `FINDING_OPEN`); the 19 entries in its finding register are now `FIXED_VERIFIED` after D1. D2.2 then edited one complete Docker lesson, which is included in this export. Those earlier reviews are agent work and do not convert these entries into human SME sign-off.

Rules: prompt >180 characters or option >155 → clarity; correct-option mean > wrong-option mean by ≥45 characters and ≥1.75×, or ≥2 extreme distractors → distractors; explanation <48 characters or ≥2 option feedback strings <34 → feedback; missing required probe or Command Library ID → technical. These thresholds find review candidates and can miss semantic faults.

## Counts

| Classification | Questions |
|---|---:|
| KEEP | 563 |
| EDIT_CLARITY | 0 |
| EDIT_DISTRACTORS | 9 |
| EDIT_FEEDBACK | 48 |
| TECHNICAL_ISSUE | 0 |
| MULTIPLE_ISSUES | 0 |

Flagged at least once: **57/620**. A question can carry several issue labels.

## Topic review order

| Topic | Scored | Flagged by rules |
|---|---:|---:|
| Control Panel | 44 | 13 |
| Web Server & HTTP | 44 | 7 |
| Docker & Containers | 44 | 7 |
| Backup & Recovery | 44 | 7 |
| Billing & Lifecycle | 44 | 7 |
| Virtualization | 44 | 5 |
| Disk & Filesystem | 45 | 3 |
| Linux System & Services | 44 | 2 |
| Security & Abuse | 44 | 2 |
| DNS & Domain | 45 | 2 |
| CPU, RAM & Performance | 44 | 1 |
| VPS Management | 44 | 1 |
| SSH | 45 | 0 |
| Network | 45 | 0 |

Highest flag counts are in Control Panel, Web, Docker, Backup, and Billing. These are triage counts driven mostly by terse option feedback; they are not a normalized quality score or proof those topics have incorrect keys.

## Tickets with the most concrete review flags

| Ticket | Topic / level | Flagged questions | Evidence to inspect |
|---|---|---:|---|
| VPS-12-002 | Control Panel / L0 | 3 | triage: EDIT_FEEDBACK (So nguồn và timestamp trước khi coi VM đã tắt.); output: EDIT_FEEDBACK (Điều tra lớp đồng bộ mà không cắt VM đang chạy.); evidence: EDIT_FEEDBACK (over: SSH không đo trạng thái worker. / p1: Đây là thông tin có timestamp cũ.) |
| VPS-05-002 | Disk & Filesystem / L0 | 2 | output: EDIT_FEEDBACK (ram: df -i không đo RAM. / full: Đúng IFree0/IUse%100 của df -i.); evidence: EDIT_FEEDBACK (inode: df -i có IFree0 và IUse%100. / gb: df -h có Avail11G và Use%45.) |
| VPS-07-006 | Web Server & HTTP / L2 | 2 | check: EDIT_FEEDBACK (Đọc response local trước khi so app state.); evidence: EDIT_FEEDBACK (p2: App chưa ổn định ởstate phục vụ. / p1: Có response Service Unavailable.) |
| VPS-07-003 | Web Server & HTTP / L1 | 2 | check: EDIT_FEEDBACK (Gửi đúng path trước khi so config và file.); evidence: EDIT_FEEDBACK (p2: Cần so đường dẫn này với release. / p1: Đây là status URL được hỏi.) |
| VPS-13-001 | Docker & Containers / L0 | 2 | triage: EDIT_FEEDBACK (symptom: Đây là điều khách cần kiểm tra. / other: Khách chưa cung cấp VM state.); evidence: EDIT_FEEDBACK (p1: Đọc từ danh sách container. / p2: Đọc từ log container.) |
| VPS-13-005 | Docker & Containers / L2 | 2 | triage: EDIT_FEEDBACK (symptom: Đúng khác biệt cần tái kiểm tra. / other: Khách đã nêu host hoạt động.); check: EDIT_FEEDBACK (Phép đo cần ở đúng namespace của ứng dụng.) |
| VPS-11-004 | Backup & Recovery / L1 | 2 | triage: EDIT_FEEDBACK (other: Khách không nêu thao tác này. / symptom: Đúng tác vụ cần mở để đọc lỗi.); evidence: EDIT_FEEDBACK (p2: Mức dùng phù hợp thiếu headroom. / p1: Lỗi chỉ rõ kho lưu snapshot.) |
| VPS-11-005 | Backup & Recovery / L2 | 2 | triage: EDIT_FEEDBACK (symptom: Đúng phần khách cần tìm lại. / other: Khách đã xác nhận boot được.); evidence: EDIT_FEEDBACK+EDIT_FEEDBACK (Hai nguồn chưa xác nhận dữ liệu bị xóa.) |
| VPS-12-003 | Control Panel / L1 | 2 | check: EDIT_FEEDBACK+EDIT_FEEDBACK (OS mong muốn thuộc order, guest cho OS thực tế.); evidence: EDIT_FEEDBACK (p2: Đọc từ os-release. / p1: Đọc từ ordered OS.) |
| VPS-12-005 | Control Panel / L2 | 2 | check: EDIT_FEEDBACK (Đọc task trước khi xem chi tiết job liên quan.); evidence: EDIT_FEEDBACK+EDIT_FEEDBACK (Chỉ xác nhận chờ lock và snapshot đang chạy.) |
| VPS-12-006 | Control Panel / L2 | 2 | triage: EDIT_FEEDBACK (Cần so order với guest trước gán nguyên nhân.); evidence: EDIT_FEEDBACK (p2: Đọc trực tiếp từ ip addr. / p1: Đây là IP để đối chiếu cấp phát.) |
| VPS-12-008 | Control Panel / L3 | 2 | check: EDIT_FEEDBACK (Task history khác danh sách VM hiện có.); evidence: EDIT_FEEDBACK+EDIT_FEEDBACK (Những quan sát này chưa cho phép xóa một VM.) |

## Concrete examples to edit first

- **VPS-03-001/triage** (L0, Linux System & Services; scripts/content/phase-b-01-05.mjs:542): EDIT_DISTRACTORS — Có 2 phương án sai dùng khẳng định tuyệt đối hoặc hành động cực đoan; xem liệu có thể loại bằng văn phong thay vì bằng chứng. “http: HTTP từ client chắc chắn truy cập được. | nginx: Nginx chắc chắn đang chạy.”
- **VPS-05-002/output** (L0, Disk & Filesystem; scripts/content/phase-b-01-05.mjs:285): EDIT_FEEDBACK — 2 option feedback dưới 34 ký tự; cần kiểm tra lý do cụ thể cho từng lựa chọn. “ram: df -i không đo RAM. | full: Đúng IFree0/IUse%100 của df -i.”
- **VPS-05-002/evidence** (L0, Disk & Filesystem; scripts/content/phase-b-01-05.mjs:286): EDIT_FEEDBACK — 2 option feedback dưới 34 ký tự; cần kiểm tra lý do cụ thể cho từng lựa chọn. “inode: df -i có IFree0 và IUse%100. | gb: df -h có Avail11G và Use%45.”
- **VPS-07-001/evidence** (L0, Web Server & HTTP; scripts/content/phase-b-06-10.mjs:808): EDIT_DISTRACTORS — Có 2 phương án sai dùng khẳng định tuyệt đối hoặc hành động cực đoan; xem liệu có thể loại bằng văn phong thay vì bằng chứng. “config: Cấu hình Nginx chắc chắn sai cú pháp. | upstream: ISP chắc chắn làm webserver dừng.”
- **VPS-05-004/output** (L1, Disk & Filesystem; scripts/content/phase-b-01-05.mjs:322): EDIT_DISTRACTORS — Có 2 phương án sai dùng khẳng định tuyệt đối hoặc hành động cực đoan; xem liệu có thể loại bằng văn phong thay vì bằng chứng. “safe: Dữ liệu trên volume chắc chắn nguyên vẹn. | block: Root filesystem / chắc chắn đầy.”
- **VPS-03-004/check** (L1, Linux System & Services; scripts/content/phase-b-01-05.mjs:579): EDIT_FEEDBACK — Explanation ngắn dưới 48 ký tự; cần kiểm tra có giải thích bằng chứng hoặc giới hạn kết luận hay không. “getenforce chỉ đọc chế độ, không chuyển mode.”
- **VPS-07-006/check** (L2, Web Server & HTTP; scripts/content/phase-b-06-10.mjs:776): EDIT_FEEDBACK — Explanation ngắn dưới 48 ký tự; cần kiểm tra có giải thích bằng chứng hoặc giới hạn kết luận hay không. “Đọc response local trước khi so app state.”
- **VPS-07-006/evidence** (L2, Web Server & HTTP; scripts/content/phase-b-06-10.mjs:778): EDIT_FEEDBACK — 2 option feedback dưới 34 ký tự; cần kiểm tra lý do cụ thể cho từng lựa chọn. “p2: App chưa ổn định ởstate phục vụ. | p1: Có response Service Unavailable.”
- **VPS-07-007/check** (L3, Web Server & HTTP; scripts/content/phase-b-06-10.mjs:466): EDIT_DISTRACTORS — Đáp án đúng dài trung bình 72 ký tự, phương án sai 26; độ dài có thể lộ key. “openssl s_client -connect 198.51.100.20:443 -servername shop.example.com”
- **VPS-08-001/evidence** (L0, DNS & Domain; scripts/content/phase-b-06-10.mjs:395): EDIT_FEEDBACK — 3 option feedback dưới 34 ký tự; cần kiểm tra lý do cụ thể cho từng lựa chọn. “p1: Đây là A record tại điểm hỏi. | p2: Đây là IP mới được cấp cho VPS. | over: Chưa hỏi từng authoritative NS.”
- **VPS-04-008/check** (L3, CPU, RAM & Performance; scripts/content/phase-b-01-05.mjs:519): EDIT_DISTRACTORS — Đáp án đúng dài trung bình 94 ký tự, phương án sai 16; độ dài có thể lộ key. “journalctl -u backup-agent --since "2026-10-22 02:00:00 UTC" --until "2026-10-22 02:30:00 UTC"”
- **VPS-07-003/check** (L1, Web Server & HTTP; scripts/content/phase-b-06-10.mjs:746): EDIT_FEEDBACK — Explanation ngắn dưới 48 ký tự; cần kiểm tra có giải thích bằng chứng hoặc giới hạn kết luận hay không. “Gửi đúng path trước khi so config và file.”
- **VPS-07-003/evidence** (L1, Web Server & HTTP; scripts/content/phase-b-06-10.mjs:748): EDIT_FEEDBACK — 2 option feedback dưới 34 ký tự; cần kiểm tra lý do cụ thể cho từng lựa chọn. “p2: Cần so đường dẫn này với release. | p1: Đây là status URL được hỏi.”
- **VPS-07-005/check** (L2, Web Server & HTTP; scripts/content/phase-b-06-10.mjs:72): EDIT_DISTRACTORS — Đáp án đúng dài trung bình 113 ký tự, phương án sai 39; độ dài có thể lộ key. “echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -dates”
- **VPS-08-006/evidence** (L2, DNS & Domain; scripts/content/phase-b-06-10.mjs:368): EDIT_FEEDBACK — 2 option feedback dưới 34 ký tự; cần kiểm tra lý do cụ thể cho từng lựa chọn. “p1: Đây là đích IPv4 quan sát được. | p2: Đây là đích IPv6 cần đối chiếu.”
- **VPS-06-006/output** (L2, VPS Management; scripts/content/phase-b-06-10.mjs:919): EDIT_DISTRACTORS — Có 2 phương án sai dùng khẳng định tuyệt đối hoặc hành động cực đoan; xem liệu có thể loại bằng văn phong thay vì bằng chứng. “over: OS trên disk chắc chắn đã mất. | ignore: Disk còn trong inventory nên chắc chắn boot khỏe.”
- **VPS-10-001/evidence** (L0, Virtualization; scripts/content/phase-b-06-10.mjs:247): EDIT_FEEDBACK — Explanation ngắn dưới 48 ký tự; cần kiểm tra có giải thích bằng chứng hoặc giới hạn kết luận hay không. “Hai nguồn khớp state không kiểm tra integrity.”
- **VPS-10-003/evidence** (L1, Virtualization; scripts/content/phase-b-06-10.mjs:285): EDIT_FEEDBACK — 3 option feedback dưới 34 ký tự; cần kiểm tra lý do cụ thể cho từng lựa chọn. “p2: Đây là cấu hình mong muốn của VM. | over: Chưa có dữ liệu guest firewall. | p1: domiflist liệt kê Source đó.”
- **VPS-10-006/order** (L2, Virtualization; scripts/content/phase-b-06-10.mjs:966): EDIT_FEEDBACK — 2 option feedback dưới 34 ký tự; cần kiểm tra lý do cụ thể cho từng lựa chọn. “evidence: Lập timeline trước can thiệp. | act: Không ghi đè trạng thái hiện tại.”
- **VPS-10-007/evidence** (L3, Virtualization; scripts/content/phase-b-06-10.mjs:987): EDIT_FEEDBACK — 2 option feedback dưới 34 ký tự; cần kiểm tra lý do cụ thể cho từng lựa chọn. “p2: Monitor ghi cửa sổ rớt gói. | p1: Panel ghi cửa sổ migration.”
- **VPS-10-008/output** (L3, Virtualization; scripts/content/phase-b-06-10.mjs:1009): EDIT_DISTRACTORS — Có 2 phương án sai dùng khẳng định tuyệt đối hoặc hành động cực đoan; xem liệu có thể loại bằng văn phong thay vì bằng chứng. “over: Guest chắc chắn chậm đúng một ngày. | ignore: Host đúng giờ nên guest chắc chắn đúng.”
- **VPS-09-003/check** (L1, Security & Abuse; scripts/content/phase-b-06-10.mjs:350): EDIT_FEEDBACK — Explanation ngắn dưới 48 ký tự; cần kiểm tra có giải thích bằng chứng hoặc giới hạn kết luận hay không. “Mode khác với log AVC và listener của backend.”
- **VPS-09-007/check** (L3, Security & Abuse; scripts/content/phase-b-06-10.mjs:158): EDIT_DISTRACTORS — Đáp án đúng dài trung bình 86 ký tự, phương án sai 12; độ dài có thể lộ key. “journalctl -u sshd --since "2026-10-22 09:00:00 UTC" --until "2026-10-22 09:30:00 UTC"”
- **VPS-13-001/triage** (L0, Docker & Containers; scripts/content/phase-b-11-14.mjs:1530): EDIT_FEEDBACK — 2 option feedback dưới 34 ký tự; cần kiểm tra lý do cụ thể cho từng lựa chọn. “symptom: Đây là điều khách cần kiểm tra. | other: Khách chưa cung cấp VM state.”
- **VPS-13-001/evidence** (L0, Docker & Containers; scripts/content/phase-b-11-14.mjs:1584): EDIT_FEEDBACK — 2 option feedback dưới 34 ký tự; cần kiểm tra lý do cụ thể cho từng lựa chọn. “p1: Đọc từ danh sách container. | p2: Đọc từ log container.”
- **VPS-13-004/evidence** (L1, Docker & Containers; scripts/content/phase-b-11-14.mjs:2002): EDIT_FEEDBACK — Explanation ngắn dưới 48 ký tự; cần kiểm tra có giải thích bằng chứng hoặc giới hạn kết luận hay không. “Dữ liệu không tự xác định giải pháp tài nguyên.” EDIT_FEEDBACK — 2 option feedback dưới 34 ký tự; cần kiểm tra lý do cụ thể cho từng lựa chọn. “p2: Đây là mức dùng tại lần đo. | p1: Docker ghi nhận sự kiện.”
- **VPS-13-005/triage** (L2, Docker & Containers; scripts/content/phase-b-11-14.mjs:1037): EDIT_FEEDBACK — 2 option feedback dưới 34 ký tự; cần kiểm tra lý do cụ thể cho từng lựa chọn. “symptom: Đúng khác biệt cần tái kiểm tra. | other: Khách đã nêu host hoạt động.”
- **VPS-13-005/check** (L2, Docker & Containers; scripts/content/phase-b-11-14.mjs:1055): EDIT_FEEDBACK — Explanation ngắn dưới 48 ký tự; cần kiểm tra có giải thích bằng chứng hoặc giới hạn kết luận hay không. “Phép đo cần ở đúng namespace của ứng dụng.”
- **VPS-13-007/evidence** (L3, Docker & Containers; scripts/content/phase-b-11-14.mjs:1259): EDIT_FEEDBACK — Explanation ngắn dưới 48 ký tự; cần kiểm tra có giải thích bằng chứng hoặc giới hạn kết luận hay không. “Không suy toàn stack khỏe từ API Up.”
- **VPS-13-008/evidence** (L3, Docker & Containers; scripts/content/phase-b-11-14.mjs:1429): EDIT_FEEDBACK — Explanation ngắn dưới 48 ký tự; cần kiểm tra có giải thích bằng chứng hoặc giới hạn kết luận hay không. “Đừng đồng nhất thay tag với quyền rollback.”

## Evidence and verification limits

- The authored output is a fixture, not observed production or lab output. A plausible answer still needs source, lab, or provider SOP verification where the command ledger says pending.
- Required probes are listed per question; `allTicketProbes` keeps the complete case context, including optional and post-action probes. A command link does not prove that a statement agrees with the card.
- Source lines point to the Phase B authoring record. `source.overrides` lists matching later edits where detectable; inspect `scripts/guided-content.mjs` for late D1/D2 patches before rewriting.

## Files

- `02_Question_Review.csv`: one row per scored question, IDs and triage reasons.
- `03_Content_By_Topic/*.json`: full review packet; preserves case and question order.
- `04_Command_Content_Conflicts.md`: verified structural conflicts and semantic comparison limits.
- `05_Editorial_Priority.md`: prioritized review queues.

## Verification record — 2026-10-26

- Baseline Git: `8ec08f7` on `master`; working tree was clean before D3-A.
- `npm run prepare-data`: PASS, 112 original tickets and 112 Guided cases generated.
- `npm run audit:content`: PASS, 0 errors; 112 Guided, 122 cards, 620 scored prompts.
- `npm test -- --run`: PASS, 39/39 tests.
- `npm run build`: PASS; existing Vite warning for a JavaScript chunk over 500 kB.
- `node scripts/export-d3-assessment.mjs`: PASS; each scored question was compared with generated prompt, options, key and feedback before export.
- Git status at delivery: see commit and final task summary; no runtime, answer key, fixture or progress source changes were authored for D3-A.
