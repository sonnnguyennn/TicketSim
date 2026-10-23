# Roadmap tổng thể

| Giai đoạn | Trạng thái | Phạm vi |
|---|---|---|
| Milestone 1 — Guided foundation | Hoàn thành | Giữ 112 ticket; 8 pilot Guided; fixture terminal; 25 command đầu tiên; migration v1→v2. |
| Milestone 2 — Learning Experience & Knowledge System | Đã triển khai trong phạm vi pilot + cải thiện chung | Rà soát 8 pilot; thêm step order và short answer tự đối chiếu; command library và tra cứu trong ticket; theo dõi lỗi, ôn nhanh; UX chung cho 112 ticket. Quy tắc Mastered cũ đã được siết ở 5A. |
| Milestone 3 — Practice & Exam | Bản nền đã triển khai cho 112 ticket | Practice giữ gợi ý và tra lệnh; Exam có draft/lịch sử riêng, hai fixture gốc, không gợi ý trong bài, đáp án sau nộp và rubric tự chấm. Chưa có chấm tự động short answer hoặc chứng nhận năng lực. |
| Milestone 4 / Phase 5C — Content expansion | Đang làm: 72/112 Guided | Batch 3–4 hoàn thành; 16 case VPS/ảo hóa mới tách guest, panel và hypervisor. L2/L3 có probe bổ sung bắt buộc và câu sắp xếp bước. |
| Milestone 5A — Stateful Troubleshooting & Learning Quality | Đã triển khai pilot 6/112 | SSH, Nginx, disk full, missing route, DNS delegation, storage escalation. State/action/verification fixture, quyền và safety gate, Objective Exam 6 câu mỗi case, lỗi theo nhóm, v5 progress. |
| Milestone 5B — Independent Review & QA | Hoàn thành cho 6 pilot | Sáu tình huống biến thể, Mastered sau 24 giờ và đúng toàn bộ; browser QA desktop/mobile, keyboard, import/export/refresh/migration. |
| Phase 4 — Learning experience | Hoàn thành ở mức ứng dụng | Beginner/Normal/Independent lưu trong v5; Command Library luôn truy cập được; Review Mistakes nhóm lỗi theo kiến thức và mở bài ôn liên quan. Mastered chỉ tính lượt đầu của biến thể độc lập. |

## Độ phủ hiện tại

| Mức | Guided đã biên soạn | Practice + Exam |
|---|---:|---:|
| L0 | 18/28 | 28/28 |
| L1 | 18/28 | 28/28 |
| L2 | 18/28 | 28/28 |
| L3 | 18/28 | 28/28 |
| **Tổng** | **72/112** | **112/112** |

Stateful + Objective Exam + bài ôn biến thể: **6/112** (`VPS-01-001`, `VPS-02-001`, `VPS-03-001`, `VPS-05-001`, `VPS-05-004`, `VPS-08-003`). Thư viện hiện có 102 thẻ command/tác vụ. Practice/Legacy Exam vẫn là 112/112.

## Việc tiếp theo để làm mới đủ 112 ticket

Các batch còn lại đã được chia theo ID/topic và mức đếm trong [kế hoạch phủ 112](Guided_112_Batch_Plan.md): Batch 5–7 còn 16 + 16 + 8 case, lần lượt đạt 88, 104 và 112 Guided. Mỗi batch có checklist nội dung, schema/fixture, chấm điểm, command/state, browser, test/build và báo cáo QA. [QA Batch 4](Phase_5C_Batch_4_QA.md) ghi kết quả hiện tại.

1. Biên soạn Guided cho 40 ticket còn lại theo lô chủ đề và mức độ. Mỗi case phải rà bằng chứng, câu hỏi, feedback, command và giới hạn kết luận; không chấp nhận câu hỏi sinh trực tiếp từ trường `expected_diagnosis`.
2. Làm giàu output ngắn bằng fixture được biên soạn và kiểm định riêng, giữ nguyên 224 source probe của bộ gốc. Thêm nhánh điều tra và phân biệt mức độ khó thật sự, nhất là L2/L3.
3. Mở Objective Exam sang case có đủ đáp án, bằng chứng và câu hỏi xác minh; giữ Legacy Exam tự đánh giá cho phần còn lại. Không chấm prose bằng keyword.
4. Mở rộng bài ôn biến thể từ 6 lên các Guided case còn lại, kiểm tra sau độ trễ và không mở đáp án trước nộp.
5. Kiểm tra trình duyệt toàn bộ luồng Stateful/Objective/Guided, import/export, bàn phím và mobile. Mở rộng state/action chỉ bằng fixture đã biên soạn, không kết nối VPS thật.

Quyết định phạm vi và hướng dẫn tác giả nội dung nằm trong [living spec](TicketSim_UX_Learning_Redesign_Spec.md). Repository Git đã được khởi tạo; mỗi phase có commit riêng. Xem [QA 5B](Milestone_5B_QA.md) và [QA batch 30](Phase_2_Guided_QA.md).

[QA Phase 4](Phase_4_QA.md) ghi kiểm thử mức hỗ trợ và Review Mistakes tại thời điểm 42/112 Guided; hiện tại 72/112 Guided và 40 case còn lại.

