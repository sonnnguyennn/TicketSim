# VPS Support Ticket Simulator

Ứng dụng React + TypeScript chạy local để học xử lý ticket VPS Support. Bộ dữ liệu gốc vẫn có **112 ticket, 14 chủ đề, L0–L3**. Cả 112 ticket có Practice và Legacy Exam tự đánh giá; **42 ticket** có Guided, trong đó **6 ticket** có Stateful Simulator, Objective Exam và bài ôn biến thể. Xem [roadmap](ROADMAP.md) và [living spec](TicketSim_UX_Learning_Redesign_Spec.md).

## Chạy và kiểm tra

Yêu cầu Node.js 20.19+ (hoặc 22.12+, 24+) và npm.

```bash
npm install
npm run prepare-data
npm run dev
npm test -- --run
npm run build
npm run test:browser
```

Mở URL local do Vite hiển thị. Sau khi cài dependency, app không cần internet hay API key. `dist/` là bản build tĩnh, cần phục vụ qua HTTP local.

## Học và ôn tập

- **Guided (42 case):** Nhận diện → Kiểm tra → Đọc bằng chứng → Quyết định → Ghi ticket. Câu khách quan gồm chọn một, chọn nhiều, chọn command, đọc output và sắp xếp bước. Cuối bài là short answer tự đối chiếu với đáp án mẫu. Mỗi lựa chọn có giải thích; đáp án toàn ticket chỉ hiện sau khi nộp. 30 bài mới phủ bảy topic ưu tiên; L2/L3 có fixture bổ sung bắt buộc và câu sắp xếp quy trình.
- **Practice và Legacy Exam (112 ticket):** Practice có gợi ý, tra command và rubric tự chấm. Legacy Exam giấu gợi ý, command suggestion và đáp án trong bài; yêu cầu xem hai fixture, viết nhận định và tự đối chiếu rubric sau nộp. Điểm này luôn gắn nhãn **tự đánh giá**; văn bản tự do không bị chấm bằng keyword.
- **Stateful Simulator (6 ticket):** điều tra bằng các output ban đầu; lựa chọn hành động chỉ hiện sau P1/P2. Engine đòi đúng bằng chứng và quyền trước hành động được phép, sau đó nạp output trạng thái mới. Hành động không an toàn bị chặn; chưa có fixture thì chỉ báo chưa hỗ trợ. Hoàn tất cần chạy các probe hậu hành động và viết ticket note. Phục hồi một phần hoặc escalation không bị trình bày như resolved.
- **Objective Exam (6 ticket):** sáu câu chọn đáp án đã biên soạn cho triệu chứng, command, output, bằng chứng, quyết định và xác minh/escalation. Điểm khách quan riêng với Legacy Exam; đáp án và giải thích mở sau nộp. Lỗi được phân loại và lưu vào Review Mistakes.
- **Review Mistakes:** gom lỗi chưa khắc phục theo kiến thức, mở bài ôn ngắn đúng nhóm, và ghi thêm lỗi Stateful/Objective Exam theo nhóm sai kiến thức, thiếu bằng chứng, hành động không an toàn. Sáu case Stateful có bài kiểm tra biến thể khác tình huống; Mastered đòi đúng toàn bộ ở **lượt đầu** của biến thể sau ít nhất 24 giờ từ lượt Guided gần nhất. Lặp lại cùng câu hỏi/biến thể sau khi xem feedback không cấp Mastered; 36 case Guided còn lại chưa có bài biến thể.
- **Mức hỗ trợ:** Beginner hiện command gợi ý và rút gọn form Practice; Normal gợi ý theo độ khó; Independent yêu cầu tự nhập phép kiểm tra và ẩn hint. Command Library vẫn mở được ngay trong ticket ở cả ba mức. Lựa chọn được lưu trong tiến độ v5, không xóa ghi chú cũ.
- **Thư viện command:** 96 thẻ tài liệu, mở được ngay trong Practice/Guided hoặc ở trang riêng. Mỗi thẻ có công dụng, cú pháp CentOS Stream 9/Ubuntu hoặc ngữ cảnh panel, tham số, ví dụ output, cách đọc, khi dùng, kiểm tra tiếp, quyền và mức an toàn. Thư viện là tài liệu; xem thẻ không chạy lệnh hoặc tự tạo output.
- **Toàn bộ 112 ticket:** command lookup tại terminal, typeahead từ fixture của ticket, chữ và bố cục dễ đọc hơn, nút quay lại ticket đang học. Ở L0, form hiện bốn ô chính; ba ô bổ sung nằm trong phần tùy chọn. Lịch sử luyện tự do và rubric tự đánh giá được giữ nguyên.

Tám pilot L0: `VPS-01-001`, `VPS-01-002`, `VPS-02-001`, `VPS-03-001`, `VPS-05-001`, `VPS-05-002`, `VPS-07-001`, `VPS-08-002`. Bốn case Guided L1 mới: `VPS-01-003`, `VPS-03-003`, `VPS-05-004`, `VPS-08-003`.

Sáu case **Stateful + Objective Exam**: `VPS-01-001` (SSH service stopped), `VPS-03-001` (Nginx stopped), `VPS-05-001` (disk full), `VPS-02-001` (missing default route), `VPS-08-003` (DNS delegation/configuration), `VPS-05-004` (storage I/O error, escalation). Case DNS là delegation ở registrar và zone trong panel, không phải lỗi guest resolver. Các trạng thái sau xử lý được biên soạn riêng; P1/P2 gốc không bị sửa. Xem [bảng nghiệm thu và giới hạn mô phỏng](Milestone_5A_QA.md).

## Dữ liệu và an toàn

`scripts/guided-content.mjs` là nguồn nội dung Guided. Sau khi sửa, chạy `npm run prepare-data`; không sửa trực tiếp JSON sinh ra trong `src/data/` và `public/`. Script xác thực schema, giữ nguyên 112 ticket và tách câu hỏi công khai khỏi feedback, gợi ý và đáp án. Tách file là rào chắn học tập của UI local, không phải bảo mật trước người có quyền đọc build.

Terminal **chỉ trả đúng output JSON đã biên soạn cho command/alias và trạng thái của ticket**. Command chưa có fixture không tạo output và không tính sai; thao tác thay đổi hệ thống chỉ đi qua action mô phỏng có điều kiện. Không có shell, SSH, VirtualBox hay kết nối VPS thật. Các thẻ command và ví dụ output chỉ là tài liệu tham khảo. Đối với một sự cố thực, service active/route xuất hiện/incident được mở chưa đủ để kết luận yêu cầu khách hàng đã được giải quyết.

Tiến độ lưu ở `localStorage` phiên bản 5 và có thể xuất/nhập JSON. App chuyển dữ liệu hợp lệ từ v1–v4 sang v5, giữ key cũ làm bản dự phòng; lịch sử cũ không bị xóa. Stateful, Objective Exam, Legacy Exam, Guided và Practice có bản nháp/lượt làm riêng. Dữ liệu trình duyệt phụ thuộc origin, nên `localhost` và `127.0.0.1` có tiến độ riêng.

## Giới hạn nội dung

Guided đã phủ 42/112 ticket; Stateful/Objective Exam và bài biến thể phủ 6/112. Một số output gốc rất ngắn và vẫn được giữ nguyên. State transitions là tình huống cố định, không dự đoán trạng thái Linux thật, không mô phỏng đầy đủ network propagation, ứng dụng phía sau hay integrity storage. Còn 70 Guided case cần biên soạn và kiểm định kỹ thuật. Xem [QA batch 30](Phase_2_Guided_QA.md), [kiểm tra 12 case đầu](Milestone_2_Content_Audit.md) và [roadmap](ROADMAP.md).

Các batch 3–7 cho 70 case còn lại được liệt kê theo ID và checklist nghiệm thu trong [kế hoạch Guided 112](Guided_112_Batch_Plan.md); đây là kế hoạch nội dung, chưa phải 70 bài đã triển khai.

Xem [QA Phase 4](Phase_4_QA.md) về mức hỗ trợ, hàng đợi kiến thức, Mastered và kiểm thử dữ liệu cũ.

## Milestone 5B update

Sáu Stateful case có tình huống ôn độc lập được biên soạn riêng. `Mastered` chỉ được cấp khi đúng toàn bộ câu hỏi ở lượt đầu của tình huống mới sau ít nhất 24 giờ từ lượt Guided gần nhất. Case chưa có biến thể vẫn ở `Completed`. Đáp án ôn tách khỏi prompt; ghi chú tự do vẫn do người học tự đối chiếu.

Chạy `npm run test:browser` để kiểm tra Chromium desktop/mobile. Nếu máy chỉ có bản Chromium cũ, đặt `PLAYWRIGHT_CHROMIUM_PATH` trỏ tới executable. Xem [QA 5B](Milestone_5B_QA.md) về phạm vi kiểm tra.

