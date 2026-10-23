# Roadmap tổng thể

| Giai đoạn | Trạng thái | Phạm vi |
|---|---|---|
| Milestone 1 — Guided foundation | Hoàn thành | Giữ 112 ticket; 8 pilot Guided; fixture terminal; 25 command đầu tiên; migration v1→v2. |
| Milestone 2 — Learning Experience & Knowledge System | Đã triển khai trong phạm vi pilot + cải thiện chung | Rà soát 8 pilot; thêm step order và short answer tự đối chiếu; command library và tra cứu trong ticket; theo dõi lỗi, ôn nhanh; UX chung cho 112 ticket. Quy tắc Mastered cũ đã được siết ở 5A. |
| Milestone 3 — Practice & Exam | Bản nền đã triển khai cho 112 ticket | Practice giữ gợi ý và tra lệnh; Exam có draft/lịch sử riêng, hai fixture gốc, không gợi ý trong bài, đáp án sau nộp và rubric tự chấm. Chưa có chấm tự động short answer hoặc chứng nhận năng lực. |
| Milestone 4 — Content expansion | Đang làm: 12/112 Guided | Thêm bốn case L1 SSH, Nginx, storage và DNS đã rà soát. Tiếp tục biên soạn theo chủ đề/mức độ; không tự động biến đáp án gốc thành câu hỏi chấm điểm. |
| Milestone 5A — Stateful Troubleshooting & Learning Quality | Đã triển khai pilot 6/112 | SSH, Nginx, disk full, missing route, DNS delegation, storage escalation. State/action/verification fixture, quyền và safety gate, Objective Exam 6 câu mỗi case, lỗi theo nhóm, v5 progress. Legacy Exam vẫn có cho 112/112; chưa có bài biến thể để cấp Mastered. |
| Milestone 5B — Guided Quality Expansion | Đề xuất tiếp theo | Biên soạn biến thể đánh giá khác tình huống và Mastered; thêm kiểm định trình duyệt/keyboard/mobile cho 6 pilot, rồi mở rộng theo chủ đề với chuyên gia nội dung. |

## Độ phủ hiện tại

| Mức | Guided đã biên soạn | Practice + Exam |
|---|---:|---:|
| L0 | 8/28 | 28/28 |
| L1 | 4/28 | 28/28 |
| L2 | 0/28 | 28/28 |
| L3 | 0/28 | 28/28 |
| **Tổng** | **12/112** | **112/112** |

Stateful + Objective Exam: **6/112** (`VPS-01-001`, `VPS-02-001`, `VPS-03-001`, `VPS-05-001`, `VPS-05-004`, `VPS-08-003`). Thư viện hiện có 76 thẻ command/tác vụ, bao gồm các thẻ hành động có mức rủi ro. Độ phủ chung Practice/Legacy Exam vẫn là 112/112.

## Việc tiếp theo để làm mới đủ 112 ticket

1. Biên soạn Guided cho 100 ticket còn lại theo lô chủ đề, bắt đầu từ L0 chưa phủ rồi L1–L3. Mỗi case phải rà bằng chứng, câu hỏi, feedback, command và giới hạn kết luận; không chấp nhận câu hỏi sinh trực tiếp từ trường `expected_diagnosis`.
2. Làm giàu output ngắn bằng fixture được biên soạn và kiểm định riêng, giữ nguyên 224 source probe của bộ gốc. Thêm nhánh điều tra và phân biệt mức độ khó thật sự, nhất là L2/L3.
3. Mở Objective Exam sang case có đủ đáp án, bằng chứng và câu hỏi xác minh; giữ Legacy Exam tự đánh giá cho phần còn lại. Không chấm prose bằng keyword.
4. Biên soạn bài ôn cùng kiến thức ở tình huống khác, kiểm tra lại sau độ trễ và không mở đáp án trước nộp; chỉ khi đó mới xét Mastered.
5. Kiểm tra trình duyệt toàn bộ luồng Stateful/Objective/Guided, import/export, bàn phím và mobile. Mở rộng state/action chỉ bằng fixture đã biên soạn, không kết nối VPS thật.

Quyết định phạm vi và hướng dẫn tác giả nội dung nằm trong [living spec](TicketSim_UX_Learning_Redesign_Spec.md). Không có repository Git trong thư mục này ở lần kiểm tra ngày 23/10/2026.
# Milestone 5B status — 2026-10-23

Completed: alternate-scenario review and delayed independent Mastered for six Stateful pilots; 1440px/390px browser QA, keyboard path, import/export/refresh and v1 migration smoke tests. See [Milestone 5B QA](Milestone_5B_QA.md). Guided coverage remains 12/112 at this checkpoint; the next phase adds at least 30 reviewed Guided cases across the seven priority topics.

