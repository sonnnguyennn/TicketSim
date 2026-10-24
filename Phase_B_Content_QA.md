# Phase B — Full Guided Content Overhaul

## Phạm vi và kết quả

| Hạng mục | Kết quả |
|---|---:|
| Source ticket được giữ nguyên | 112/112 |
| Guided có biên soạn riêng và agent rà theo từng ID | 112/112 |
| Câu hỏi có prompt và giải thích viết lại | 620/620 mỗi loại |
| Nhãn phương án viết lại | 1.730/1.876 |
| Feedback phương án viết lại | 1.876/1.876 |
| Hint và verification prompt viết lại | 336/336 và 112/112 |
| Sáu trường đáp án cuối viết lại | 672/672 |
| Command Library được rà / có sửa | 122/122 / 60/122 |
| Guided-only probe command hoặc output được sửa, có lý do | 101 |
| Độ phủ Objective Exam / Stateful / biến thể Mastered | 20 / 6 / 20 ticket |

Số liệu lấy từ `npm run audit:content` sau khi sinh dữ liệu. 112 ticket đều có dòng kiểm tra trong [audit theo ID](Phase_B_Ticket_Audit.md); ghi chú biên tập chi tiết ở `Phase_B_Review_01_05.md`, `Phase_B_Review_06_10.md`, `Phase_B_Review_11_14.md` và hai sidecar DNS/Security. Đây là rà soát trực tiếp bởi agent theo từng case, **chưa có chuyên gia con người độc lập ký duyệt**.

## B1 — Kiến trúc và 14 mẫu

Baseline trước thay đổi: commit `351c38e`, working tree sạch, 112 Guided, 122 command cards, 620 câu chấm điểm. B1 commit `86093f9` tạo lớp nội dung riêng theo case; `addBatchCase()` vẫn dựng khung ID, key, loại câu và gate nhưng không quyết định lời diễn giải cuối. Mười bốn mẫu phủ 14 topic và L0–L3. Có `customerExplanation`, ba phần giải thích probe (công dụng, lý do, cách đọc), câu hỏi/feedback/hint/đáp án riêng. B1 đã chạy prepare-data, audit partial, 23/23 unit, 20/20 browser Edge và build thành công.

## B2 — Nội dung đủ 112 và Command Library

B2 commit `e5a686a` tích hợp ba module topic và sidecar DNS/Security, cung cấp bản ghi riêng cho mọi ticket, kể cả 12 pilot cũ. Mỗi bản ghi có câu hỏi, phương án, feedback đúng/sai, hint và sáu trường đáp án cuối. Phương án giữ nguyên ID và key, chỉ thay câu chữ hoặc thứ tự hiển thị ổn định. Người học phải thu thập probe bắt buộc trước các câu đọc bằng chứng; câu kết luận nhấn mạnh giới hạn dữ kiện khi chưa rõ nguyên nhân. L2/L3 có probe bổ sung, giả thuyết cạnh tranh, giới hạn quyền và escalation theo tình huống.

Thư viện 122 thẻ đã được đối chiếu công dụng, flag, ngữ cảnh CentOS Stream 9/Ubuntu, output mẫu, giới hạn kết luận và quyền thao tác; 60 thẻ đã sửa. Ví dụ output rỗng được giải thích ngoài stdout. `docker compose ps --all`, cgroup trong container, firewalld zone, lệnh network và sample output được sửa theo phạm vi thực tế. Xem [audit thẻ lệnh](Phase_B_Command_Audit.md).

Source ticket và probe gốc không bị sửa. 101 command/output được sửa hoặc bổ sung **chỉ cho Guided**; từng thay đổi có before/after, lý do và nguồn tham khảo trong [báo cáo fixture](Phase_B_Fixture_Changes.md). Đây là mẫu biên soạn từ tài liệu, không phải stdout thu trên máy khách hoặc Linux thật.

## B3 — Kiểm định tích hợp

`npm run audit:content` là gate bắt buộc trước unit tests. Audit kiểm tra 112 case, 122 thẻ, ID/key/gate, liên kết command, probe có thể truy cập, feedback/hint, sáu trường đáp án, source/progress/hidden-engine hash và tách đáp án khỏi public JSON. Prompt trùng nguyên văn giảm từ nhóm lớn nhất 100 xuống 1; feedback trùng nguyên văn còn một nhóm hai lần. Xem [báo cáo duplicate](Phase_B_Duplicate_Report.md). Số liệu này chỉ là tín hiệu; agent vẫn đọc tính hợp lý kỹ thuật và phương án sai.

Sau tích hợp toàn bộ, các gate đã chạy:

| Kiểm tra | Kết quả |
|---|---|
| `npm run prepare-data` | Thành công; 112 Guided sinh dữ liệu riêng |
| `npm run audit:content` | Thành công; 0 lỗi, 101 Guided-only fixture changes ghi nhận |
| `npm test -- --run` | 26/26 passed; gồm fixture-only command, grading, ẩn đáp án, tiến độ v1–v5, Objective/Stateful/Review và regression kỹ thuật |
| `npm run build` | Thành công; Vite cảnh báo JS bundle khoảng 1 MB sau minify |
| `npm run test:browser` | 36/36 passed trên Edge; 15 đường Guided đầy đủ phủ 14 topic/L0–L3, desktop/mobile, DNSSEC, panel/hypervisor/empty stdout, command lookup, hint, feedback, progress, v1–v5 migration và v5 import/export |

Các test browser dùng origin riêng; không xóa dữ liệu người dùng. Không kết nối SSH, VirtualBox hoặc VPS thật. Terminal chỉ tra command/alias có fixture JSON; lệnh không khớp không sinh stdout. Đáp án Guided được tải sau khi nộp trong UI; build local không dùng đây làm ranh giới bảo mật.

## Giới hạn còn lại

- Chưa có vòng kiểm duyệt độc lập của chuyên gia vận hành VPS hoặc chạy fixture trên CentOS Stream 9/Ubuntu thật. Tài liệu kỹ thuật đã được đối chiếu nhưng mọi output là mẫu giả lập có chủ đích.
- Browser suite đi trọn 15 bài đại diện, còn 97 ticket chưa được tự động click end-to-end; audit dữ liệu và unit regression vẫn bao phủ cả 112.
- Short answer/ticket note tiếp tục tự đối chiếu. Objective Exam còn 20/112, Stateful 6/112 và biến thể Mastered 20/112 theo phạm vi trước Phase B. Phase B không mở rộng các mode đó.
- Bundle JS lớn có cảnh báo hiệu năng. Chưa tách chunk vì Phase B ưu tiên nội dung và không thêm thay đổi UX/kiến trúc lớn.

Các commit B2/B3 và kết quả gate cuối cùng được ghi tại Git history; nếu nội dung đổi sau checkpoint này phải chạy lại audit, unit, build và browser trước khi nhận hoàn thành.
