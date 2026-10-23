# Phase B — Audit theo ticket

Các ghi chú dưới đây là rà soát từng case bởi agent, không phải chỉ schema validation và không phải chứng nhận độc lập của chuyên gia con người.

| ID | Topic | Level | Trạng thái | Kiểm tra kỹ thuật | Biên tập |
|---|---|---|---|---|---|
| VPS-01-001 | Lỗi kết nối SSH | L0 | Đã rà soát và sửa | Đối chiếu systemctl/ss; tách trạng thái unit, listener và xác thực. Không thay đáp án hay điều kiện quyền. | Viết lại đủ sáu câu, từng lựa chọn, ba hint và note; giải thích command theo triệu chứng refused. |
| VPS-01-002 | Lỗi kết nối SSH | L0 | Chờ rà soát |  |  |
| VPS-02-001 | Lỗi kết nối mạng | L0 | Chờ rà soát |  |  |
| VPS-03-001 | Lỗi hệ thống và service | L0 | Chờ rà soát |  |  |
| VPS-05-001 | Ổ đĩa và filesystem | L0 | Chờ rà soát |  |  |
| VPS-05-002 | Ổ đĩa và filesystem | L0 | Chờ rà soát |  |  |
| VPS-07-001 | Website/HTTP | L0 | Chờ rà soát |  |  |
| VPS-08-002 | Tên miền/DNS | L0 | Chờ rà soát |  |  |
| VPS-01-003 | Lỗi kết nối SSH | L1 | Chờ rà soát |  |  |
| VPS-03-003 | Lỗi hệ thống và service | L1 | Đã rà soát và sửa | Đối chiếu nginx -t: test cú pháp/mở file, không tự sửa và không chứng minh HTTP. Giữ key gốc. | Rà cả pilot thủ công; viết lại năm prompt, toàn bộ feedback và giải thích mốc thay đổi. |
| VPS-05-004 | Ổ đĩa và filesystem | L1 | Chờ rà soát |  |  |
| VPS-08-003 | Tên miền/DNS | L1 | Đã rà soát và sửa | Giữ phân biệt resolver-cache, edited zone và registrar; evidence chỉ hỏi hai nguồn đầu để tránh mâu thuẫn khi đã đọc G1. | Rà pilot thủ công; bỏ P1/P2/fixture khỏi prompt và feedback. |
| VPS-01-004 | Lỗi kết nối SSH | L1 | Chờ rà soát |  |  |
| VPS-01-005 | Lỗi kết nối SSH | L2 | Chờ rà soát |  |  |
| VPS-01-006 | Lỗi kết nối SSH | L2 | Chờ rà soát |  |  |
| VPS-01-007 | Lỗi kết nối SSH | L3 | Chờ rà soát |  |  |
| VPS-02-002 | Lỗi kết nối mạng | L0 | Chờ rà soát |  |  |
| VPS-02-003 | Lỗi kết nối mạng | L1 | Chờ rà soát |  |  |
| VPS-02-004 | Lỗi kết nối mạng | L1 | Chờ rà soát |  |  |
| VPS-02-005 | Lỗi kết nối mạng | L2 | Chờ rà soát |  |  |
| VPS-02-007 | Lỗi kết nối mạng | L3 | Chờ rà soát |  |  |
| VPS-03-002 | Lỗi hệ thống và service | L0 | Chờ rà soát |  |  |
| VPS-03-004 | Lỗi hệ thống và service | L1 | Chờ rà soát |  |  |
| VPS-03-005 | Lỗi hệ thống và service | L2 | Chờ rà soát |  |  |
| VPS-03-006 | Lỗi hệ thống và service | L2 | Chờ rà soát |  |  |
| VPS-04-001 | Hiệu năng VPS | L0 | Chờ rà soát |  |  |
| VPS-04-002 | Hiệu năng VPS | L0 | Chờ rà soát |  |  |
| VPS-04-003 | Hiệu năng VPS | L1 | Chờ rà soát |  |  |
| VPS-04-004 | Hiệu năng VPS | L1 | Chờ rà soát |  |  |
| VPS-04-005 | Hiệu năng VPS | L2 | Chờ rà soát |  |  |
| VPS-05-003 | Ổ đĩa và filesystem | L1 | Chờ rà soát |  |  |
| VPS-05-005 | Ổ đĩa và filesystem | L2 | Chờ rà soát |  |  |
| VPS-05-006 | Ổ đĩa và filesystem | L2 | Chờ rà soát |  |  |
| VPS-05-007 | Ổ đĩa và filesystem | L3 | Đã rà soát và sửa | Giữ phân biệt ro/backup với integrity; cấm fsck mounted-rw và chuyển storage. Kiểm tra tên unit và khung systemctl output. | Sáu câu và ba hint đi từ rescue tới bảo toàn/recovery; không chốt ổ vật lý hỏng. |
| VPS-07-002 | Website/HTTP | L0 | Chờ rà soát |  |  |
| VPS-07-004 | Website/HTTP | L1 | Chờ rà soát |  |  |
| VPS-07-006 | Website/HTTP | L2 | Chờ rà soát |  |  |
| VPS-07-007 | Website/HTTP | L3 | Chờ rà soát |  |  |
| VPS-08-001 | Tên miền/DNS | L0 | Chờ rà soát |  |  |
| VPS-08-004 | Tên miền/DNS | L1 | Chờ rà soát |  |  |
| VPS-08-005 | Tên miền/DNS | L2 | Chờ rà soát |  |  |
| VPS-08-007 | Tên miền/DNS | L3 | Chờ rà soát |  |  |
| VPS-01-008 | Lỗi kết nối SSH | L3 | Chờ rà soát |  |  |
| VPS-02-006 | Lỗi kết nối mạng | L2 | Đã rà soát và sửa | Đọc ICMP theo đích/nguồn, không quy router lỗi từ hop ICMP. Giữ phân biệt TCP reachability với SSH login. | Sáu câu tập trung phạm vi đường đi, số đo và escalation; bỏ cấu trúc hỏi chung. |
| VPS-02-008 | Lỗi kết nối mạng | L3 | Chờ rà soát |  |  |
| VPS-03-007 | Lỗi hệ thống và service | L3 | Chờ rà soát |  |  |
| VPS-03-008 | Lỗi hệ thống và service | L3 | Chờ rà soát |  |  |
| VPS-04-006 | Hiệu năng VPS | L2 | Chờ rà soát |  |  |
| VPS-04-007 | Hiệu năng VPS | L3 | Đã rà soát và sửa | Sửa nhận định vmstat: báo cáo đầu là trung bình từ boot, cần dòng thứ hai để gọi là mẫu tiếp. Không định danh noisy neighbor. | Sáu câu kiểm tra sự khác nhau giữa process CPU/steal, scope host và escalation. |
| VPS-04-008 | Hiệu năng VPS | L3 | Chờ rà soát |  |  |
| VPS-05-008 | Ổ đĩa và filesystem | L3 | Chờ rà soát |  |  |
| VPS-07-003 | Website/HTTP | L1 | Chờ rà soát |  |  |
| VPS-07-005 | Website/HTTP | L2 | Đã rà soát và sửa | openssl x509-dates phải có cả notBefore/notAfter; so sánh mốc UTC; service active không xác minh cert deployment. | Bỏ thuật ngữ nội bộ trong 6 câu và ghi rõ SNI/deployment. |
| VPS-07-008 | Website/HTTP | L3 | Chờ rà soát |  |  |
| VPS-08-006 | Tên miền/DNS | L2 | Chờ rà soát |  |  |
| VPS-08-008 | Tên miền/DNS | L3 | Chờ rà soát |  |  |
| VPS-06-001 | Quản lý VPS | L0 | Đã rà soát và sửa | Phân biệt nguồn VM, event và ý định owner; panel snapshot không đồng nghĩa hardware failure. | Viết lại 5 câu, 15 lựa chọn; bổ sung diễn giải khách và ngữ cảnh từng phép đọc. |
| VPS-06-002 | Quản lý VPS | L0 | Chờ rà soát |  |  |
| VPS-06-003 | Quản lý VPS | L1 | Chờ rà soát |  |  |
| VPS-06-004 | Quản lý VPS | L1 | Chờ rà soát |  |  |
| VPS-06-005 | Quản lý VPS | L2 | Chờ rà soát |  |  |
| VPS-06-006 | Quản lý VPS | L2 | Chờ rà soát |  |  |
| VPS-06-007 | Quản lý VPS | L3 | Chờ rà soát |  |  |
| VPS-06-008 | Quản lý VPS | L3 | Chờ rà soát |  |  |
| VPS-10-001 | Ảo hóa/hạ tầng | L0 | Chờ rà soát |  |  |
| VPS-10-002 | Ảo hóa/hạ tầng | L0 | Chờ rà soát |  |  |
| VPS-10-003 | Ảo hóa/hạ tầng | L1 | Chờ rà soát |  |  |
| VPS-10-004 | Ảo hóa/hạ tầng | L1 | Chờ rà soát |  |  |
| VPS-10-005 | Ảo hóa/hạ tầng | L2 | Đã rà soát và sửa | lsblk phải là bảng thiết bị; domblklist thiếu vdb không đồng nghĩa disk deleted; bảo vệ đúng ID và dữ liệu. | Câu hỏi phân biệt attachment, thiết bị và integrity, không dùng thuật ngữ nội bộ. |
| VPS-10-006 | Ảo hóa/hạ tầng | L2 | Chờ rà soát |  |  |
| VPS-10-007 | Ảo hóa/hạ tầng | L3 | Chờ rà soát |  |  |
| VPS-10-008 | Ảo hóa/hạ tầng | L3 | Chờ rà soát |  |  |
| VPS-09-001 | Bảo mật/abuse | L0 | Chờ rà soát |  |  |
| VPS-09-002 | Bảo mật/abuse | L0 | Chờ rà soát |  |  |
| VPS-09-003 | Bảo mật/abuse | L1 | Chờ rà soát |  |  |
| VPS-09-004 | Bảo mật/abuse | L1 | Chờ rà soát |  |  |
| VPS-09-005 | Bảo mật/abuse | L2 | Chờ rà soát |  |  |
| VPS-09-006 | Bảo mật/abuse | L2 | Chờ rà soát |  |  |
| VPS-09-007 | Bảo mật/abuse | L3 | Đã rà soát và sửa | Phân biệt Accepted với failed; last không xác thực actor. Thay fingerprint rút gọn bằng dạng SHA256 hợp lệ 43 ký tự. | Viết rõ uncertain authorization và bảo toàn chứng cứ, không quy danh tính từ IP. |
| VPS-09-008 | Bảo mật/abuse | L3 | Chờ rà soát |  |  |
| VPS-13-001 | Docker (bổ sung) | L0 | Chờ rà soát |  |  |
| VPS-13-002 | Docker (bổ sung) | L0 | Chờ rà soát |  |  |
| VPS-13-003 | Docker (bổ sung) | L1 | Chờ rà soát |  |  |
| VPS-13-004 | Docker (bổ sung) | L1 | Chờ rà soát |  |  |
| VPS-13-005 | Docker (bổ sung) | L2 | Chờ rà soát |  |  |
| VPS-13-006 | Docker (bổ sung) | L2 | Đã rà soát và sửa | Tách route container, IPv4 forwarding, NAT và firewall; không cam kết bật ip_forward chữa mọi lớp. Kiểm tra Docker bridge docs và iptables/nftables forwarding caveat. | Viết lại đủ sáu câu theo đường đi gói và ranh giới quyền; hint tăng dần theo container→host→policy. |
| VPS-13-007 | Docker (bổ sung) | L3 | Chờ rà soát |  |  |
| VPS-13-008 | Docker (bổ sung) | L3 | Chờ rà soát |  |  |
| VPS-11-001 | Sao lưu/khôi phục | L0 | Đã rà soát và sửa | Tách quota target khỏi dung lượng guest; không xem failed task hoặc catalog entry là backup đã kiểm chứng. Giữ nguyên output panel được biên soạn. | Viết lại đủ năm câu, 15 phương án/feedback, ba hint và toàn bộ giải thích phép kiểm tra; diễn giải backup bằng tiếng Việt. |
| VPS-11-002 | Sao lưu/khôi phục | L0 | Chờ rà soát |  |  |
| VPS-11-003 | Sao lưu/khôi phục | L1 | Chờ rà soát |  |  |
| VPS-11-004 | Sao lưu/khôi phục | L1 | Chờ rà soát |  |  |
| VPS-11-005 | Sao lưu/khôi phục | L2 | Chờ rà soát |  |  |
| VPS-11-006 | Sao lưu/khôi phục | L2 | Chờ rà soát |  |  |
| VPS-11-007 | Sao lưu/khôi phục | L3 | Chờ rà soát |  |  |
| VPS-11-008 | Sao lưu/khôi phục | L3 | Chờ rà soát |  |  |
| VPS-12-001 | Panel/provisioning | L0 | Chờ rà soát |  |  |
| VPS-12-002 | Panel/provisioning | L0 | Chờ rà soát |  |  |
| VPS-12-003 | Panel/provisioning | L1 | Chờ rà soát |  |  |
| VPS-12-004 | Panel/provisioning | L1 | Đã rà soát và sửa | Sửa cách diễn giải nproc: CPU sẵn dùng cho tiến trình, không đồng nhất tuyệt đối với CPU online của cả VM. Tách current/max vCPU và task pending; giữ nguyên đáp án và output. | Thay prompt chung bằng phép đối chiếu plan–guest–host; feedback mỗi lựa chọn nói đúng lớp dữ liệu. |
| VPS-12-005 | Panel/provisioning | L2 | Chờ rà soát |  |  |
| VPS-12-006 | Panel/provisioning | L2 | Chờ rà soát |  |  |
| VPS-12-007 | Panel/provisioning | L3 | Chờ rà soát |  |  |
| VPS-12-008 | Panel/provisioning | L3 | Chờ rà soát |  |  |
| VPS-14-001 | Billing (bổ sung) | L0 | Chờ rà soát |  |  |
| VPS-14-002 | Billing (bổ sung) | L0 | Chờ rà soát |  |  |
| VPS-14-003 | Billing (bổ sung) | L1 | Chờ rà soát |  |  |
| VPS-14-004 | Billing (bổ sung) | L1 | Chờ rà soát |  |  |
| VPS-14-005 | Billing (bổ sung) | L2 | Chờ rà soát |  |  |
| VPS-14-006 | Billing (bổ sung) | L2 | Chờ rà soát |  |  |
| VPS-14-007 | Billing (bổ sung) | L3 | Chờ rà soát |  |  |
| VPS-14-008 | Billing (bổ sung) | L3 | Đã rà soát và sửa | Lý do abuse khác nonpayment; received khác approved; giữ ranh giới security-lead và không cam kết ETA hoặc resolved từ escalation. Các panel field là dữ liệu tình huống, không phải chính sách nhà cung cấp thật. | Bỏ lộ lý do abuse khỏi đáp án triage trước điều tra; dùng tiếng Việt cho đình chỉ, hồ sơ, chuyển cấp. |
