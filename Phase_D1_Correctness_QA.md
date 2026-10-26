# TicketSim — Phase D1 Correctness QA

## Phạm vi và kết luận

Baseline D0 là commit `a1c4470` trên Phase C2 `e1ab5c3`. Commit Major là `f8b812f`; commit Minor/Editorial và QA được tham chiếu bằng tag `phase-d1-minor` trỏ tới commit cuối. Phase D1 giữ 112 ticket ID, 122 Command Library cards, 620 scored questions, option IDs, progress v5 và migration. `starter-data/tickets.json` chỉ đổi command, stdout và hint của hai ticket có `journalctl` tương đối; các answer key gốc không đổi. Guided có 102 fixture delta so với source hiện tại; con số Phase C2 là 101 trước D1 và trước khi đồng bộ hai source fixture.

19/19 finding PC-001–PC-019 có trạng thái `FIXED_VERIFIED` trong [finding register](audit/phase-c/04_Finding_Register.csv). Không có finding mới: output `ss -ltnp` trong review variant của VPS-01-001 được gộp vào PC-001 cùng root cause. Trạng thái này xác nhận bản sửa theo source, kiểm tra nội dung và regression; **chưa phải** xác minh bằng lab VPS, provider hay SOP nội bộ.

## Before / after và bằng chứng

| Finding | Trước | Sau và phạm vi xác minh |
|---|---|---|
| PC-001 | G4 `ss` thiếu peer column | G4 và review variant của VPS-01-001 có header và peer; content test. |
| PC-002, PC-003 | G5 dùng `BatchMode` nhưng link card `ssh-vvv` | G5 dùng `ssh -vvv`, output có debug và authentication denial, card `ssh-vvv` khớp; stateful/content test. |
| PC-004 | `vàmatrixđòi` | Prompt API 403 diễn đạt permission matrix rõ; content audit. |
| PC-005 | `PID2300`, `deleted5GiB`, `khoảng5GiB` | Hint, probe notes, câu hỏi, option và đáp án VPS-05-006 có khoảng trắng và đơn vị; content audit. |
| PC-006 | Panel/virsh distractor thiếu vai trò | Prompt giới hạn quyền support ở panel; feedback nêu `virsh` chỉ dùng khi NOC có quyền; content test. |
| PC-007 | Docker distractor quá cực đoan | Lựa chọn gần hơn: rollback image chưa kiểm chứng và tạo lại cùng image thiếu dependency; content test. |
| PC-008 | `dig +cd` NOERROR chỉ có header | Fixture có A answer đúng cấu trúc; vẫn chỉ hỗ trợ giả thuyết validation, không xác nhận DS sai; content test. |
| PC-009 | G4 Nginx `ss` thiếu peer column | Header và peer TCP/80 được thêm; content test. |
| PC-010 | Đáp án nói áp lực RAM “cùng thời điểm” | Đáp án và feedback ghi dấu hiệu RAM/OOM ở các mẫu riêng; yêu cầu timeline có timestamp; content test. |
| PC-011 | Backup journal `02:00–02:30` không có ngày | Original và Guided cùng dùng 22/10/2026 02:00–02:30 UTC; stdout và hint khớp; unit + browser. |
| PC-012 | Root-login journal `today` | Original và Guided dùng 22/10/2026 09:00–09:30 UTC; stdout và hint khớp; unit + browser. |
| PC-013 | SSH session journal `yesterday 23:00` | Guided dùng 22/10/2026 23:00–23:30 UTC; unit + browser. |
| PC-014 | Hai query @1.1.1.1 được gọi “resolver khác nhau” | Triage nói cùng resolver với/không `+cd`; kết luận DNSSEC giữ mức giả thuyết; unit + browser. |
| PC-015 | Feedback rollback ghép chữ | Câu feedback VPS-13-008 đọc được; content audit. |
| PC-016 | Câu hỏi chỉ yêu cầu đo loss đích nhưng chấm ping sai | Prompt yêu cầu báo cáo từng hop; feedback công nhận ping đo endpoint loss; key MTR giữ nguyên; grading + browser. |
| PC-017 | Metadata cũng ghi restore complete nhưng bị phủ nhận | Prompt hỏi riêng activity history; feedback thừa nhận metadata cũng ghi mốc hoàn tất; grading + browser. |
| PC-018 | `top -b -n1 | head` chỉ có `%Cpu(s): 60 st` | Excerpt có summary, các CPU category cộng 100%, process header và 60% st; content test. |
| PC-019 | `chính thứ c` | Probe refund viết `chính thức`; content audit. |

Source sửa chính: [Guided authoring](scripts/guided-content.mjs), [original tickets](starter-data/tickets.json), [audit gate](scripts/audit-content.mjs), [revision guard](src/guided/GuidedWorkspace.tsx), [unit regressions](src/guided/d1Content.test.ts), [browser regressions](tests/browser.spec.ts), [full learning paths](tests/content.spec.ts). Finding register ghi vị trí source, commit, test và phạm vi riêng cho từng ID.

## Answer keys, fixtures, cards và lịch sử học

- **Answer key IDs:** không đổi. PC-016 và PC-017 sửa mục tiêu câu hỏi và feedback để chỉ còn một lựa chọn phù hợp; PC-010/014 sửa nhãn và diễn giải, không đổi ID. Correct/wrong grading được kiểm qua `gradeSelection` và full browser paths.
- **Command cards:** 122/122, không thêm/xóa card. G5 của VPS-01-001 đổi từ `ssh -o BatchMode=yes ...` sang `ssh -vvv ...` để khớp card `ssh-vvv`. Các lệnh `journalctl` P1 của VPS-04-008/VPS-09-007 và G1 của VPS-01-008 đổi thành mốc UTC tuyệt đối.
- **Fixture output:** original P1 của VPS-04-008 và VPS-09-007 đổi từ câu tóm tắt thành dòng journal có timestamp; Guided P2 của VPS-08-008 thêm A answer; P1 của VPS-10-004 có excerpt `top`; G4 `ss` của VPS-01-001/VPS-03-001 và review evidence VPS-01-001 có peer column; G5 VPS-01-001 có SSH debug. Kết quả này là **authored fixture**, không được dùng làm xác minh hạ tầng độc lập.
- **Progress:** `src/storage.ts`, `src/types.ts`, `src/guided/engine.ts`, `src/guided/review.ts` và migration không đổi. New Guided draft/attempt ghi `contentRevision=D1-2026-10-26` như metadata bổ sung được v5 bảo toàn. 15 ticket có nội dung sửa được đánh dấu revision. Draft cũ chưa nộp được giữ, hiện thông báo và chỉ làm lại khi learner chọn. Attempt cũ giữ nguyên score/outcomes; UI ghi rõ điểm cũ không so trực tiếp với câu hỏi mới. Không tự cấp Mastered.

## QA đã chạy

| Gate | Kết quả |
|---|---|
| `npm run prepare-data` | 112 tickets, 14 topics, 4 levels; 112 Guided cases |
| `npm run audit:content` | 112 reviewed, 122 cards, 620 scored questions, 102 effective fixture deltas, 0 errors |
| `npm test -- --run` | 34/34 pass, 6 files |
| `npm run build` | Pass; cảnh báo bundle >500 kB tồn tại, ngoài phạm vi D1 |
| `npm run test:browser` | 42/42 pass; full paths cho cả bảy Major findings và các fixture `ss`/`top` đã đổi |

Regression bao phủ Major tickets, các output và card liên kết, key đúng/sai, feedback, refresh và lưu v5. Browser runtime Chromium của Playwright đã được cài sau lần đầu suite không khởi chạy vì thiếu executable. Một lần chạy sau đó bị lỗi ghi file của `predev`; chạy lại trên cùng source đạt 40/40, rồi suite mở rộng cuối đạt 42/42.

## Cơ sở kỹ thuật và giới hạn

- [journalctl manual](https://www.man7.org/linux/man-pages/man1/journalctl.1.html) quy định thiếu ngày thì dùng ngày hiện tại, `today`/`yesterday` là tương đối. [systemd.time](https://www.freedesktop.org/software/systemd/man/latest/systemd.time.html) mô tả timestamp có timezone. Incident được biên soạn là **2026-10-22 UTC**; command mới có ngày và UTC rõ. Chưa chạy các lệnh này trên guest thật.
- [ping manual](https://man7.org/linux/man-pages/man8/ping.8.html) cho phép đo packet loss ở endpoint. MTR được chọn chỉ khi câu hỏi yêu cầu từng hop; intermediate ICMP loss riêng không xác định router gây lỗi.
- [ss manual](https://man7.org/linux/man-pages/man8/ss.8.html), [OpenSSH ssh](https://man.openbsd.org/ssh.1) và [ssh_config BatchMode](https://man.openbsd.org/ssh_config.5) hỗ trợ format/cờ được sửa. Test xác nhận output authored khớp mục đích card, chưa xác nhận trên distro cụ thể.
- DNSSEC `SERVFAIL` so với `+cd` chỉ gợi validation; A answer trong fixture không chứng minh DS/DNSKEY/RRSIG chain hợp lệ. Không có provider DNS, lab, chính sách thao tác host/billing/security hay SOP nội bộ trong lần QA này. 23 ticket cần SOP từ Phase C2 vẫn cần owner xác nhận trước nội dung hướng dẫn vận hành thực tế.

## Việc tiếp theo

- **D2 — xác minh vận hành:** đối chiếu 23 ticket `INTERNAL_SOP_REQUIRED` với owner; chạy lab an toàn cho journal timezone, `ss`, SSH debug, `top`, DNSSEC chain và restore flow trên môi trường phù hợp; ghi source/output thực, không dùng authored fixture làm bằng chứng độc lập.
- **D2 — consistency rộng:** tiếp tục quét lexical/spacing ở các case ngoài 19 finding và các review variant; rà Command Library theo từng distro/context khi có môi trường hoặc SOP tương ứng.
- **D3 — học tập:** đánh giá lại chất lượng distractor toàn bộ 620 câu và chiến lược quiz/Command Library sau khi đo learner outcome. Không đưa quiz overhaul hoặc thiết kế lại thư viện vào D1.

## Xác minh cuối

Toàn bộ năm gate bắt buộc đã qua trên source cuối. Browser suite chạy 42/42, gồm full path cho tất cả sáu ticket có bảy Major findings và hai fixture Minor bổ sung. Các attempt cũ và migration được kiểm tra bằng unit/browser tests; kiểm chứng lab và SOP vẫn là D2.
