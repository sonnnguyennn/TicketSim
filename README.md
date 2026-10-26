# VPS Support Ticket Simulator

Ứng dụng React + TypeScript chạy local để học xử lý ticket VPS Support. Bộ dữ liệu gốc vẫn có **112 ticket, 14 chủ đề, L0–L3**. Luồng học mặc định tập trung vào **112/112 Guided**. Dữ liệu và logic của **20 Objective Exam**, **6 Stateful** và **20 bài ôn biến thể** được bảo toàn, tạm ẩn khỏi navigation. Xem [roadmap](ROADMAP.md) và [living spec](TicketSim_UX_Learning_Redesign_Spec.md).

## Chạy và kiểm tra

Yêu cầu Node.js 20.19+ (hoặc 22.12+, 24+) và npm.

```bash
npm install
npm run prepare-data
npm run audit:content
npm run dev
npm test -- --run
npm run build
npm run test:browser
```

Mở URL local do Vite hiển thị. Sau khi cài dependency, app không cần internet hay API key. `dist/` là bản build tĩnh, cần phục vụ qua HTTP local.

## Luồng học hiện tại — Phase A

Mở Kho ticket, tìm hoặc lọc theo chủ đề/cấp độ/trạng thái, chọn ticket rồi bấm **Học ticket / Tiếp tục**. Bài học đi qua **Nhận diện → Kiểm tra → Đọc bằng chứng → Quyết định → Tổng kết**. Lịch sử chỉ hiển thị các lượt Guided đã hoàn thành; Cài đặt giữ xuất/nhập và đặt lại dữ liệu.

- **Guided (112/112):** một cột nội dung theo bước, lời khách hàng thu gọn sau Nhận diện, gợi ý mở khi cần. Giữ nguyên câu hỏi, feedback, điểm và yêu cầu bằng chứng đã biên soạn. Bộ chọn Beginner/Normal/Independent được ẩn; giao diện mặc định có gợi ý lệnh và giải thích cho người mới, không ghi đè lựa chọn hỗ trợ cũ.
- **Một terminal ở bước Kiểm tra:** nhập lệnh/tác vụ hoặc chọn gợi ý để điền vào ô nhập, rồi bấm Chạy kiểm tra. Lịch sử hiển thị tuần tự command, output đã lưu, mục đích và cách đọc. Giữ nhãn Guest/Client/Panel/Hypervisor cùng tên PANEL/BILLING/BACKUP LOG; kết quả rỗng được phân biệt với lệnh chưa được hỗ trợ.
- **Kiến thức lệnh và tác vụ (122 thẻ):** 102 thẻ shell có cú pháp, structured flags/subcommands, ví dụ output và giới hạn kết luận; 20 thẻ provider/panel/billing/backup hiển thị như tác vụ hỗ trợ, không phải lệnh Linux. Xem nhanh hoặc mở chi tiết, tìm theo flag/công dụng/triệu chứng; Quick Lookup trong ticket vẫn gọn. Quay về giữ đúng bước, lịch sử và lệnh đang nhập. Xem [QA D2](Phase_D2_Command_Knowledge_QA.md) và [ledger 122 thẻ](Phase_D2_Command_Review_Ledger.csv).
- **Tổng kết:** ghi nhận định, bằng chứng, hướng xử lý và xác minh; nộp bài để xem đáp án tham khảo. Câu viết vẫn tự đối chiếu. Hoàn thành Guided không tự cấp Mastered.

## Tính năng nâng cao được bảo toàn, tạm ẩn

Practice, Stateful (6 case), Objective Exam (20 case), Legacy Exam, Review Mistakes (20 biến thể) và lịch sử nâng cao được giữ trong code và tiến độ v5. Chúng không có lối vào ở navigation mặc định trong Phase A. Nút Tiếp tục luôn mở Guided.

Engine chấm điểm, quyền thao tác, escalation và quy tắc Mastered không đổi: Mastered đòi đúng toàn bộ lượt đầu của biến thể độc lập sau ít nhất 24 giờ; điểm Exam tự chấm hoặc Objective Exam không cấp Mastered. Không mở rộng các chế độ này trong Phase A. Tài liệu lịch sử: [QA 5A](Milestone_5A_QA.md), [QA 5D](Phase_5D_QA.md), [QA 5E](Phase_5E_QA.md).

## Dữ liệu và an toàn

`scripts/guided-content.mjs` nhập lớp tác giả theo từng case trong `scripts/content/phase-b-*.mjs`. Lớp này biên soạn nội dung; khung cũ giữ ID, key, loại câu và điều kiện bằng chứng. Xem [hướng dẫn tác giả](scripts/content/README.md). Sau khi sửa, chạy `npm run prepare-data` và `npm run audit:content`; không sửa trực tiếp JSON sinh ra trong `src/data/` và `public/`. Script xác thực schema, giữ nguyên 112 ticket và tách câu hỏi công khai khỏi feedback, gợi ý và đáp án. Tách file là rào chắn học tập của UI local, không phải bảo mật trước người có quyền đọc build.

Các output gốc sai định dạng hoặc vượt quá dữ kiện được sửa riêng ở lớp Guided, có lý do và tham khảo trong [báo cáo fixture](Phase_B_Fixture_Changes.md). Đáp án Guided nằm riêng trong `public/guided-answers/`; Practice/Legacy và 112 ticket gốc không đổi. Output là mẫu biên soạn hoặc trích đoạn, không phải kết quả chạy trên VPS thật.

Terminal **chỉ trả đúng output JSON đã biên soạn cho command/alias và trạng thái của ticket**. Command chưa có fixture không tạo output và không tính sai; thao tác thay đổi hệ thống chỉ đi qua action mô phỏng có điều kiện. Không có shell, SSH, VirtualBox hay kết nối VPS thật. Các thẻ command và ví dụ output chỉ là tài liệu tham khảo. Đối với một sự cố thực, service active/route xuất hiện/incident được mở chưa đủ để kết luận yêu cầu khách hàng đã được giải quyết.

Tiến độ lưu ở `localStorage` phiên bản 5 và có thể xuất/nhập JSON. App chuyển dữ liệu hợp lệ từ v1–v4 sang v5, giữ key cũ làm bản dự phòng; lịch sử cũ không bị xóa. Guided lưu cả lệnh đang nhập dở qua trường tùy chọn `commandInput`; draft cũ không cần có trường này. Stateful, Objective Exam, Legacy Exam, Guided và Practice có bản nháp/lượt làm riêng. Dữ liệu trình duyệt phụ thuộc origin, nên `localhost` và `127.0.0.1` có tiến độ riêng.

## QA và giới hạn hiện tại

Phase D2 giữ nguyên 112 Guided, 122 Command IDs và progress v5. Audit D2 kiểm tra knowledge schema, ID mapping, support task boundary và safety; unit/browser/build đạt. 70 thẻ đã đối chiếu nguồn chính thức ở mức cú pháp, 32 thẻ còn chờ đối chiếu nguồn, 20 thẻ support cần SOP. Không có thẻ nào được kiểm chứng trong lab; output ví dụ là trích đoạn biên soạn. Xem [QA D2](Phase_D2_Command_Knowledge_QA.md) để đọc scope của từng nhãn.

Phase B đã rà soát và biên soạn lại nội dung của cả 112 Guided; 122 thẻ Command Library được kiểm tra, trong đó 60 thẻ có sửa đổi. Audit theo ID, báo cáo trùng lặp và 101 thay đổi fixture chỉ dành cho Guided nằm trong [QA Phase B](Phase_B_Content_QA.md). QA này do agent thực hiện; chưa có vòng kiểm duyệt độc lập của chuyên gia con người.

Xem [QA Phase A](Phase_A_Guided_First_QA.md) cho các luồng đã kiểm tra và ảnh desktop/mobile ở mốc trước. Phase B bổ sung kiểm tra browser qua một bài đầy đủ cho mỗi topic, bao gồm L0–L3; chưa có kiểm thử tương tác trọn vẹn riêng cho từng ticket trong 112 ticket.

Guided phủ 112/112; Objective Exam và bài biến thể 20/112; Stateful 6/112. Một số output gốc rất ngắn và vẫn được giữ nguyên. State transitions là tình huống cố định, không dự đoán trạng thái Linux thật, không mô phỏng đầy đủ network propagation, ứng dụng phía sau hay integrity storage. Xem [QA Phase 5E](Phase_5E_QA.md), [QA Phase 5D](Phase_5D_QA.md), [QA Batch 7](Phase_5C_Batch_7_QA.md) và [roadmap](ROADMAP.md).

Batch 3–7 đã hoàn thành đủ 112 Guided theo [kế hoạch Guided 112](Guided_112_Batch_Plan.md). Objective Exam và bài ôn biến thể đã mở thêm 14 case mỗi loại; 92 case còn lại cần tình huống ôn mới được biên soạn và kiểm định riêng.

Xem [QA Phase 4](Phase_4_QA.md) về mức hỗ trợ, hàng đợi kiến thức, Mastered và kiểm thử dữ liệu cũ.

## Mốc lịch sử — Milestone 5B

Sáu Stateful case có tình huống ôn độc lập được biên soạn riêng. `Mastered` chỉ được cấp khi đúng toàn bộ câu hỏi ở lượt đầu của tình huống mới sau ít nhất 24 giờ từ lượt Guided gần nhất. Case chưa có biến thể vẫn ở `Completed`. Đáp án ôn tách khỏi prompt; ghi chú tự do vẫn do người học tự đối chiếu.

Chạy `npm run test:browser` để kiểm tra Chromium desktop/mobile. Nếu máy chỉ có bản Chromium cũ, đặt `PLAYWRIGHT_CHROMIUM_PATH` trỏ tới executable. Xem [QA 5B](Milestone_5B_QA.md) về phạm vi kiểm tra.

