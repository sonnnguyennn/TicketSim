# Roadmap tổng thể

## Ưu tiên hiện tại — Guided trước

Phase A đưa Guided thành luồng học mặc định: Kho ticket → Học ticket/Tiếp tục → năm bước học → Tổng kết. Một terminal giữ lịch sử kiểm tra; navigation chỉ giữ Kho ticket, Thư viện lệnh, Lịch sử và Cài đặt. Practice, Stateful, Objective/Legacy Exam và Review tạm ẩn, giữ engine và toàn bộ tiến độ. Xem [QA Phase A](Phase_A_Guided_First_QA.md).

## Các mốc đã triển khai

| Giai đoạn | Trạng thái | Phạm vi |
|---|---|---|
| Milestone 1 — Guided foundation | Hoàn thành | Giữ 112 ticket; 8 pilot Guided; fixture terminal; 25 command đầu tiên; migration v1→v2. |
| Milestone 2 — Learning Experience & Knowledge System | Đã triển khai trong phạm vi pilot + cải thiện chung | Rà soát 8 pilot; thêm step order và short answer tự đối chiếu; command library và tra cứu trong ticket; theo dõi lỗi, ôn nhanh; UX chung cho 112 ticket. Quy tắc Mastered cũ đã được siết ở 5A. |
| Milestone 3 — Practice & Exam | Bản nền đã triển khai cho 112 ticket | Practice giữ gợi ý và tra lệnh; Exam có draft/lịch sử riêng, hai fixture gốc, không gợi ý trong bài, đáp án sau nộp và rubric tự chấm. Chưa có chấm tự động short answer hoặc chứng nhận năng lực. |
| Milestone 4 / Phase 5C — Content expansion | Hoàn thành: 112/112 Guided | Batch 3–7 hoàn thành, giữ nguyên dữ liệu gốc; L2/L3 có probe bổ sung bắt buộc và câu sắp xếp bước. |
| Milestone 5A — Stateful Troubleshooting & Learning Quality | Đã triển khai pilot 6/112 | SSH, Nginx, disk full, missing route, DNS delegation, storage escalation. State/action/verification fixture, quyền và safety gate, Objective Exam 6 câu mỗi case, lỗi theo nhóm, v5 progress. |
| Milestone 5B — Independent Review & QA | Hoàn thành cho 6 pilot | Sáu tình huống biến thể, Mastered sau 24 giờ và đúng toàn bộ; browser QA desktop/mobile, keyboard, import/export/refresh/migration. |
| Phase 5D — Objective Exam expansion | Đã triển khai 20/112 | Thêm 14 case đủ fixture điều tra, sáu quyết định chấm khách quan; Legacy Exam và prose vẫn tự đối chiếu. Stateful giữ 6. |
| Phase 5E — Independent review expansion | Đã triển khai 20/112 | Thêm 14 tình huống mới với bằng chứng và ba câu hỏi khác bài Guided; Mastered vẫn đòi lượt đầu đúng toàn bộ sau 24 giờ. |
| Phase 4 — Learning experience | Hoàn thành ở mức ứng dụng | Beginner/Normal/Independent lưu trong v5; Command Library luôn truy cập được; Review Mistakes nhóm lỗi theo kiến thức và mở bài ôn liên quan. Mastered chỉ tính lượt đầu của biến thể độc lập. |

## Độ phủ hiện tại

| Mức | Guided đã biên soạn | Practice + Exam |
|---|---:|---:|
| L0 | 28/28 | 28/28 |
| L1 | 28/28 | 28/28 |
| L2 | 28/28 | 28/28 |
| L3 | 28/28 | 28/28 |
| **Tổng** | **112/112** | **112/112** |

Stateful **6/112** (`VPS-01-001`, `VPS-02-001`, `VPS-03-001`, `VPS-05-001`, `VPS-05-004`, `VPS-08-003`); Objective Exam **20/112**; bài ôn biến thể **20/112**. Thư viện hiện có 122 thẻ command/tác vụ. Practice/Legacy Exam vẫn là 112/112.

## Phase B — Kiểm duyệt nội dung Guided

Đã hoàn thành Batch 3–7 theo [kế hoạch phủ 112](Guided_112_Batch_Plan.md). Mỗi batch có QA, test/build và commit riêng; [QA Batch 7](Phase_5C_Batch_7_QA.md) ghi kết quả mới nhất.

1. Rà 112 Guided theo chuẩn ngắn, tự nhiên và sát ticket VPS Support; kiểm định câu hỏi, feedback, mục đích lệnh và cách đọc output.
2. Rà kỹ thuật sâu các output gốc ngắn, trường hợp chưa đủ bằng chứng và tình huống L2/L3; biên soạn bản Guided thay thế khi cần, giữ nguyên 224 source probe.
3. Kiểm tra end-to-end thêm từng ticket, gồm câu sai, gợi ý, refresh, điều hướng và mobile. QA Phase A hiện chỉ bao phủ các đường đi đại diện.
4. Giữ phân biệt Completed/Mastered. Mở rộng Stateful/Exam/Review cần quyết định sản phẩm riêng sau Guided; không nằm trong Phase A/B hiện tại.

Quyết định phạm vi và hướng dẫn tác giả nội dung nằm trong [living spec](TicketSim_UX_Learning_Redesign_Spec.md). Repository Git đã được khởi tạo; mỗi phase có commit riêng. Xem [QA 5B](Milestone_5B_QA.md) và [QA batch 30](Phase_2_Guided_QA.md).

[QA Phase 4](Phase_4_QA.md) ghi kiểm thử mức hỗ trợ và Review Mistakes tại thời điểm 42/112 Guided; hiện tại 112/112 Guided.

