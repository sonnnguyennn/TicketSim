# Phase A — Guided-first UX Simplification

Ngày kiểm tra: 2026-10-23. Phạm vi là navigation, cách trình bày Guided, terminal và UI text. Nội dung câu hỏi/feedback của 112 ticket chưa được viết lại trong phase này.

## Thay đổi đã triển khai

- Kho ticket có một hành động chính **Học ticket / Tiếp tục**. Trạng thái và thống kê chỉ tính Guided, không dùng kết quả Practice/Exam để báo hoàn thành bài Guided.
- Navigation giữ Kho ticket, Thư viện lệnh, Lịch sử và Cài đặt. Lịch sử mặc định chỉ hiển thị một danh sách lượt Guided.
- Năm bước học: Nhận diện → Kiểm tra → Đọc bằng chứng → Quyết định → Tổng kết. Bỏ sidebar thống kê/trợ giúp lặp lại; lời khách hàng thu gọn sau bước đầu, gợi ý và giải thích từng lựa chọn vẫn mở được khi cần.
- Bỏ bộ chọn hỗ trợ khỏi màn hình học. Guided luôn có gợi ý/giải thích thân thiện với người mới, không ghi đè `supportLevel` đã lưu.
- Một terminal trong Kiểm tra: gợi ý điền vào cùng ô nhập; người học chạy kiểm tra; command và output nối tiếp trong lịch sử có thể cuộn. Mỗi phép kiểm tra có nhãn Guest/Client/Panel/Hypervisor, mục đích và cách đọc đã biên soạn. PANEL/BILLING/BACKUP LOG vẫn là tác vụ có nhãn, không biến thành shell command.
- Output lấy từ `entry.output` đã lưu. Kết quả rỗng giữ nguyên chuỗi rỗng trong `<pre>`; thông báo giải thích nằm ngoài stdout. Lệnh không có kết quả hoặc bị chặn chỉ hiện thông báo UI, không có stdout giả.
- Interpret/Decide có tham chiếu bằng chứng thu gọn, không nhân đôi toàn bộ terminal. Thư viện đầy đủ giữ bài học đang mở ở nền; quay lại đúng bước, disclosure và input.
- Lưu thêm `commandInput?: string` trong Guided draft v5 để giữ lệnh chưa chạy qua refresh, đổi ticket và export/import. Trường tùy chọn được kiểm tra kiểu; draft cũ không có trường này vẫn hợp lệ. Không đổi version, engine chấm điểm hay lịch sử lệnh đã chạy.
- Chặn feedback/gợi ý đến muộn sau khi làm lại bài hoặc rời ticket, tránh phản hồi cũ ghi vào draft mới.
- Bỏ metadata lab/VirtualBox/VM-snapshot khỏi UI mặc định; giữ thông tin OS trong thẻ lệnh và ngữ cảnh ticket khi cần kỹ thuật. Rút gọn UI text, chuyển giải thích mô phỏng chung về Cài đặt.

## Tạm ẩn nhưng được bảo toàn

Practice form cũ, Stateful Simulator, Objective Exam, Legacy Exam, Review Mistakes, lịch sử nâng cao và bộ chọn Beginner/Normal/Independent không có lối vào trong navigation mặc định. Component, engine, rubric, quy tắc quyền/escalation và dữ liệu tiến độ của chúng vẫn tồn tại. Không thêm case Stateful/Exam/Review trong Phase A.

Mastered vẫn chỉ đến từ lượt đầu đúng toàn bộ của bài biến thể độc lập sau ít nhất 24 giờ; Completed không đồng nghĩa Mastered. Phase A không mở luồng biến thể và không tự cấp Mastered từ hoàn thành Guided hoặc Exam.

## Dữ liệu giữ nguyên

- 112 source tickets, 224 source probe outputs, 112 Guided, 122 thẻ Command Library.
- 20 Objective Exam, 6 Stateful, 20 bài ôn biến thể trong dữ liệu, hiện tạm ẩn.
- Câu hỏi, đáp án, feedback, aliases, probe ban đầu và yêu cầu bằng chứng L2/L3.
- Progress v5, migration v1–v4, dữ liệu các mode, xuất/nhập JSON và lịch sử Guided.
- Không sửa `scripts/guided-content.mjs`, source JSON hoặc JSON sinh ra. Không chạy lệnh điều tra thật, SSH, shell hay VM qua terminal của ứng dụng.

## File thay đổi

| File | Vai trò |
|---|---|
| `src/App.tsx` | Navigation Guided-first, trạng thái/thống kê, preview, lịch sử Guided, library return, Settings text |
| `src/guided/GuidedWorkspace.tsx` | Bố cục theo bước, unified terminal, giải thích, tham chiếu, gợi ý, lưu input và chặn async cũ |
| `src/guided/CommandLibrary.tsx` | UI text tra lệnh và empty state |
| `src/guided/engine.ts` | Nhãn Tổng kết và thông báo command; thuật toán matching/chấm điểm/gating giữ nguyên |
| `src/styles.css` | Bố cục một cột, terminal lịch sử, disclosure, desktop/mobile |
| `src/types.ts`, `src/storage.ts` | Trường input tùy chọn, kiểm tra tương thích progress cũ |
| `src/lib.test.ts` | Kiểm tra lưu/đọc input và từ chối input sai kiểu |
| `tests/browser.spec.ts` | Browser suite theo luồng Guided-first |
| `README.md`, `ROADMAP.md`, living spec | Trạng thái hiện tại, lịch sử và phạm vi Phase B |

## Kiểm thử đã thực hiện

- `npm run prepare-data`: đạt; 112 source và 112 Guided, schema/fixture/alias/answer validation đạt. JSON sinh ra không có diff.
- `npm test -- --run`: **23/23 đạt**, 4 test files. Giữ nguyên các test safety, grading, Stateful, Objective, Mastered và migration; thêm kiểm tra input tùy chọn.
- `npm run build`: đạt (`tsc -b`, Vite). Còn cảnh báo chunk JavaScript lớn hơn 500 kB.
- `npm run test:browser` với Microsoft Edge qua `PLAYWRIGHT_CHROMIUM_PATH`: **20/20 đạt**. Chromium mặc định của Playwright không có trên máy, nên dùng Edge đã cài.
- `git diff --check`: đạt.

Browser suite kiểm tra:

1. Desktop 1440px và mobile 390px: tìm/lọc topic/level/status, một CTA, không có mode/lab metadata, keyboard mở thư viện và không tràn ngang.
2. SSH `VPS-01-001`: hoàn thành năm bước, một câu cố ý sai, điểm đúng theo grading cũ, ordering, note, đáp án chỉ tải sau nộp, refresh và lịch sử chỉ có một lượt.
3. Terminal: alias có whitespace, lệnh chưa có dữ liệu, lệnh trong thư viện nhưng chưa có kết quả ở case, thao tác thay đổi bị chặn, lịch sử nối tiếp và cuộn về output cũ.
4. Thư viện → quay lại giữ input/bước/lịch sử; đổi ticket và refresh giữ draft, output cũ không có `probeId` và setting Independent. Input chưa chạy cũng được giữ.
5. Export/import so sánh nguyên snapshot v5 chứa mọi draft/attempt của các mode đã ẩn; migration v1, v2, v3, v4 giữ snapshot gốc.
6. L3 `VPS-05-007`, `VPS-09-007`, `VPS-11-008`, `VPS-14-008` vẫn cần đủ bốn phép kiểm tra trước Interpret.
7. Web override `VPS-07-003`, Hypervisor `VPS-10-005`, BACKUP LOG `VPS-11-001`, PANEL `VPS-12-001`, BILLING `VPS-14-001`, output rỗng `VPS-13-002`.
8. Giữ một request feedback rồi làm lại bài: phản hồi muộn không khôi phục responses/feedback vào draft mới.

Ảnh đã mở kiểm tra trực quan trong workspace:

- [Kho ticket desktop](screenshots/phase-a-list-1440.png)
- [Kho ticket mobile](screenshots/phase-a-list-390.png)
- [Terminal desktop](screenshots/phase-a-desktop.png)
- [Terminal mobile](screenshots/phase-a-mobile.png)

Ảnh nằm trong thư mục `screenshots/` được Git ignore; có thể tái tạo bằng browser suite.

## Giới hạn và Phase B

- QA browser bao phủ các đường đi đại diện, không phải 112 bài đều được hoàn thành end-to-end. Các test browser cũ vào Exam/Review được thay bằng kiểm tra bảo toàn dữ liệu vì các lối vào đó đã ẩn; unit tests của engine vẫn chạy. Không tuyên bố đã kiểm tra browser các màn hình nâng cao trong Phase A.
- Câu hỏi, feedback, mục đích lệnh/cách đọc và một số stdout gốc còn ngắn, tiếng Anh hoặc cách diễn đạt nội bộ. Phase B cần rà kỹ thuật và biên tập từng ticket; Phase A không coi việc đổi bố cục là đã kiểm định nội dung.
- 92 case chưa có Objective, 92 chưa có biến thể và 106 chưa có Stateful. Đây là dữ liệu nền được giữ lại, không phải phạm vi mở rộng hiện tại.
- Tiến độ vẫn phụ thuộc origin của trình duyệt; đổi host/port cần xuất/nhập. Không mô phỏng hệ điều hành tự do hoặc sinh kết quả cho command bất kỳ.
- Bundle lớn vẫn còn; không đổi kiến trúc tải module trong Phase A.

## Commits

1. `5855596` — Guided-first navigation và UI cleanup.
2. `b38317a` — Guided workspace và unified terminal.
3. Commit chứa tài liệu này — UI text, bảo toàn input, tests và QA cuối.
