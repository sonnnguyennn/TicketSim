# Phase B — Full Guided Content Overhaul

## B1 checkpoint

Baseline: `351c38e` (Phase A), working tree sạch trước khi sửa; 112 Guided, 122 command cards, 620 câu được chấm. Baseline kiểm thử: prepare-data, 23/23 unit, 20/20 browser Edge và production build đều đạt.

B1 biên soạn 14 mẫu, một ở mỗi topic và đủ L0–L3. `scripts/content/phase-b-*.mjs` là lớp tác giả case-specific được nhập bởi `scripts/guided-content.mjs`; `addBatchCase()` giữ khung ID/key/gate, không quyết định văn phong cuối. Mỗi mẫu có diễn giải triệu chứng tiếng Việt, prompt/phương án/feedback/hint/note riêng và ba phần giải thích command (công dụng, lý do dùng, cách đọc).

Source112, progress v5, aliases và các engine an toàn/chấm điểm được giữ nguyên. Guided-only stdout corrections có lý do và tham khảo trong [danh sách fixture](Phase_B_Fixture_Changes.md). Đáp án Guided có file riêng, giữ đáp án Practice/Legacy gốc. UI Phase A chỉ bổ sung phần diễn giải và lý do dùng command.

Kiểm tra B1: prepare-data + audit partial đạt; 23/23 unit và build đạt; browser Edge 20/20 đạt. Unit comparison đối chiếu override được biên soạn thay vì bắt giữ dòng mô tả giả stdout. Các test an toàn, migration, grading và history vẫn giữ.

Các mẫu đã được agent đọc/rà theo từng case, không chỉ schema; chưa có chuyên gia con người kiểm duyệt độc lập. 98 case còn lại và toàn bộ Command Library thuộc B2. B3 sẽ chốt audit toàn bộ, browser theo 14 topic và tài liệu; B1 không phải tuyên bố hoàn thành112.

Xem [audit theo ID](Phase_B_Ticket_Audit.md), [duplicate trước/sau](Phase_B_Duplicate_Report.md), [review01–05](Phase_B_Review_01_05.md), [review06–10](Phase_B_Review_06_10.md), [review11–14](Phase_B_Review_11_14.md).
