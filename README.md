# VPS Support Ticket Simulator

Ứng dụng React + TypeScript chạy local để học xử lý ticket VPS Support. Bộ dữ liệu gốc vẫn có **112 ticket, 14 chủ đề, L0–L3**. Cả 112 ticket có Practice và Legacy Exam tự đánh giá; **12 ticket** có Guided, trong đó **6 ticket** có Stateful Simulator và Objective Exam. Xem [roadmap](ROADMAP.md) và [living spec](TicketSim_UX_Learning_Redesign_Spec.md).

## Chạy và kiểm tra

Yêu cầu Node.js 20.19+ (hoặc 22.12+, 24+) và npm.

```bash
npm install
npm run prepare-data
npm run dev
npm test -- --run
npm run build
```

Mở URL local do Vite hiển thị. Sau khi cài dependency, app không cần internet hay API key. `dist/` là bản build tĩnh, cần phục vụ qua HTTP local.

## Học và ôn tập

- **Guided (12 case đã rà soát):** Nhận diện → Kiểm tra → Đọc bằng chứng → Quyết định → Ghi ticket. Câu khách quan gồm chọn một, chọn nhiều, chọn command, đọc output và sắp xếp bước. Cuối bài là short answer tự đối chiếu với đáp án mẫu. Mỗi lựa chọn có giải thích; đáp án toàn ticket chỉ hiện sau khi nộp. Gợi ý có thể mở từng mức, nhưng mức tiết lộ bằng chứng cần probe tương ứng.
- **Practice và Legacy Exam (112 ticket):** Practice có gợi ý, tra command và rubric tự chấm. Legacy Exam giấu gợi ý, command suggestion và đáp án trong bài; yêu cầu xem hai fixture, viết nhận định và tự đối chiếu rubric sau nộp. Điểm này luôn gắn nhãn **tự đánh giá**; văn bản tự do không bị chấm bằng keyword.
- **Stateful Simulator (6 ticket):** điều tra bằng các output ban đầu; lựa chọn hành động chỉ hiện sau P1/P2. Engine đòi đúng bằng chứng và quyền trước hành động được phép, sau đó nạp output trạng thái mới. Hành động không an toàn bị chặn; chưa có fixture thì chỉ báo chưa hỗ trợ. Hoàn tất cần chạy các probe hậu hành động và viết ticket note. Phục hồi một phần hoặc escalation không bị trình bày như resolved.
- **Objective Exam (6 ticket):** sáu câu chọn đáp án đã biên soạn cho triệu chứng, command, output, bằng chứng, quyết định và xác minh/escalation. Điểm khách quan riêng với Legacy Exam; đáp án và giải thích mở sau nộp. Lỗi được phân loại và lưu vào Review Mistakes.
- **Review Mistakes:** giữ bài ôn Guided ngắn và ghi thêm lỗi Stateful/Objective Exam theo nhóm sai kiến thức, thiếu bằng chứng, hành động không an toàn. Bài lặp lại cùng câu hỏi là luyện tập; **không cấp Mastered**. Schema tiến độ đã có `variantId` để mở rộng bài đánh giá cùng kỹ năng trong tình huống khác; các biến thể đó chưa được biên soạn.
- **Thư viện command:** 76 thẻ tài liệu, mở được ngay trong Practice/Guided hoặc ở trang riêng. Mỗi thẻ có công dụng, cú pháp CentOS Stream 9/Ubuntu hoặc ngữ cảnh panel, tham số, ví dụ output, cách đọc, khi dùng, kiểm tra tiếp, quyền và mức an toàn. Thư viện là tài liệu; xem thẻ không chạy lệnh hoặc tự tạo output.
- **Toàn bộ 112 ticket:** command lookup tại terminal, typeahead từ fixture của ticket, chữ và bố cục dễ đọc hơn, nút quay lại ticket đang học. Ở L0, form hiện bốn ô chính; ba ô bổ sung nằm trong phần tùy chọn. Lịch sử luyện tự do và rubric tự đánh giá được giữ nguyên.

Tám pilot L0: `VPS-01-001`, `VPS-01-002`, `VPS-02-001`, `VPS-03-001`, `VPS-05-001`, `VPS-05-002`, `VPS-07-001`, `VPS-08-002`. Bốn case Guided L1 mới: `VPS-01-003`, `VPS-03-003`, `VPS-05-004`, `VPS-08-003`.

Sáu case **Stateful + Objective Exam**: `VPS-01-001` (SSH service stopped), `VPS-03-001` (Nginx stopped), `VPS-05-001` (disk full), `VPS-02-001` (missing default route), `VPS-08-003` (DNS delegation/configuration), `VPS-05-004` (storage I/O error, escalation). Case DNS là delegation ở registrar và zone trong panel, không phải lỗi guest resolver. Các trạng thái sau xử lý được biên soạn riêng; P1/P2 gốc không bị sửa. Xem [bảng nghiệm thu và giới hạn mô phỏng](Milestone_5A_QA.md).

## Dữ liệu và an toàn

`scripts/guided-content.mjs` là nguồn nội dung Guided. Sau khi sửa, chạy `npm run prepare-data`; không sửa trực tiếp JSON sinh ra trong `src/data/` và `public/`. Script xác thực schema, giữ nguyên 112 ticket và tách câu hỏi công khai khỏi feedback, gợi ý và đáp án. Tách file là rào chắn học tập của UI local, không phải bảo mật trước người có quyền đọc build.

Terminal **chỉ trả đúng output JSON đã biên soạn cho command/alias và trạng thái của ticket**. Command chưa có fixture không tạo output và không tính sai; thao tác thay đổi hệ thống chỉ đi qua action mô phỏng có điều kiện. Không có shell, SSH, VirtualBox hay kết nối VPS thật. Các thẻ command và ví dụ output chỉ là tài liệu tham khảo. Đối với một sự cố thực, service active/route xuất hiện/incident được mở chưa đủ để kết luận yêu cầu khách hàng đã được giải quyết.

Tiến độ lưu ở `localStorage` phiên bản 5 và có thể xuất/nhập JSON. App chuyển dữ liệu hợp lệ từ v1–v4 sang v5, giữ key cũ làm bản dự phòng; lịch sử cũ không bị xóa. Stateful, Objective Exam, Legacy Exam, Guided và Practice có bản nháp/lượt làm riêng. Dữ liệu trình duyệt phụ thuộc origin, nên `localhost` và `127.0.0.1` có tiến độ riêng.

## Giới hạn nội dung

Guided mới được biên soạn cho 12/112 ticket; Stateful/Objective Exam mới phủ 6/112. Một số output gốc rất ngắn và vẫn được giữ nguyên. State transitions là tình huống cố định, không dự đoán trạng thái Linux thật, không mô phỏng đầy đủ network propagation, ứng dụng phía sau hay integrity storage. Không có bài biến thể để cấp Mastered; 100 Guided case còn lại cần tác giả và kiểm định kỹ thuật. Xem [kiểm tra nội dung Guided](Milestone_2_Content_Audit.md) và [roadmap](ROADMAP.md).

# Milestone 5B update

Six Stateful cases now include an independently authored review scenario. `Mastered` is granted only when every question in that new scenario is correct at least 24 hours after the latest Guided completion. Other Guided cases remain `Completed` until they have a reviewed alternate scenario. Review feedback is stored separately from prompts; free text is still self-reviewed.

Run `npm run test:browser` for desktop/mobile Chromium smoke tests. On a machine with an older installed Chromium, set `PLAYWRIGHT_CHROMIUM_PATH` to its executable. See [Milestone 5B QA](Milestone_5B_QA.md) for coverage and limits.

