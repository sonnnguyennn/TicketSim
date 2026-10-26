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
| Phase B — Guided content overhaul | Hoàn thành trong phạm vi nội dung | 112 case được agent rà và biên soạn lại; 122 thẻ lệnh được kiểm tra, 60 thẻ sửa; audit và browser representative đạt. Chưa có kiểm duyệt SME độc lập. |
| Phase C/C2 — Independent content audit | Hoàn thành ở mức reasoned review | 112 ticket, 122 command, 620 câu hỏi và fixture được rà; source/lab/SOP là các mức xác minh riêng. |
| Phase D1 — Correctness remediation | Hoàn thành ở mức source và regression | 19 findings được sửa theo [QA D1](Phase_D1_Correctness_QA.md); 23 ticket vẫn chờ SOP. |
| Phase D2 — Command Knowledge System | Đã triển khai, verification còn chờ | 122 thẻ: 102 shell và 20 support task; flags/examples có cấu trúc, UX hai lớp, ledger và regression. Metadata hiện có 71 source-verified về cú pháp, 31 pending, 20 SOP-required, 0 lab-verified. Xem [QA D2](Phase_D2_Command_Knowledge_QA.md) cho mốc lịch sử và [ledger](Phase_D2_Command_Review_Ledger.csv) cho trạng thái hiện tại. |
| Phase D3-C2 — Full content editorial | Agent review hoàn tất; SME/lab/SOP còn chờ | Rà 620 câu, sửa 70; rà 122 command, sửa 1; rà 112 English notes, sửa 11. Không đổi answer key/ID; browser 50/50. A02 distractor quality còn cần SME độc lập. Xem [audit D3-C2](audit/phase-d3-c2/01_Executive_Summary.md). |

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

B1 tạo lớp biên soạn riêng và 14 mẫu; B2 áp dụng cho 112 case và kiểm tra 122 thẻ lệnh; B3 chốt audit, regression, tài liệu. Giữ nguyên source ticket, ID/key/gate, progress v5 và các chế độ nâng cao đang ẩn. Xem [QA Phase B](Phase_B_Content_QA.md).

Đã hoàn thành Batch 3–7 theo [kế hoạch phủ 112](Guided_112_Batch_Plan.md). Mỗi batch có QA, test/build và commit riêng; [QA Batch 7](Phase_5C_Batch_7_QA.md) ghi kết quả mới nhất.

1. Đề nghị chuyên gia VPS Support độc lập rà các case L2/L3 và 101 fixture Guided thay thế trước khi dùng làm tài liệu đào tạo chính thức.
2. Kiểm tra tương tác end-to-end thêm các ticket ngoài 15 đường đại diện, gồm câu sai, gợi ý, refresh và mobile.
3. Mở rộng Objective Exam, Stateful hoặc bài ôn biến thể sau khi có dữ liệu và phạm vi sản phẩm phù hợp; Phase B không mở thêm các chế độ này.

Quyết định phạm vi và hướng dẫn tác giả nội dung nằm trong [living spec](TicketSim_UX_Learning_Redesign_Spec.md). Repository Git đã được khởi tạo; mỗi phase có commit riêng. Xem [QA 5B](Milestone_5B_QA.md) và [QA batch 30](Phase_2_Guided_QA.md).

## D3 — Xác minh vận hành

Đối chiếu 31 thẻ lệnh còn pending với manual chính thức theo phiên bản, chạy lab cách ly cho output/exit status, và lấy SOP/owner sign-off cho 23 ticket và 20 tác vụ support trước khi dùng như quy trình sản xuất. Không mở rộng Stateful/Exam khi các gate này còn thiếu.

[QA Phase 4](Phase_4_QA.md) ghi kiểm thử mức hỗ trợ và Review Mistakes tại thời điểm 42/112 Guided; hiện tại 112/112 Guided.

