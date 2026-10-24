# Phase B — Technical/editorial review, topics 11–14

## B1 samples inspected and revised

| Ticket | Topic | Level | Status | Specific technical/editorial finding |
|---|---|---|---|---|
| VPS-11-001 | Backup | L0 | Reviewed and revised | Target quota is not guest disk space; failed task is not a verified backup. All question/option feedback now names the relevant task/log/retention decision. |
| VPS-12-004 | Panel | L1 | Reviewed and revised | nproc counts CPUs available to the calling process; affinity/offline CPUs and current/max host allocation must be distinguished. No key change. |
| VPS-13-006 | Docker | L2 | Reviewed and revised | Container default route does not prove forwarding or NAT; host change requires policy and approval. |
| VPS-14-008 | Billing | L3 | Reviewed and revised | Removed premature abuse reason from triage; appeal received is not approved; security-lead owns override. |

B1 count: 4 cases technically/editorially inspected and revised, not merely schema validated. Other 28 cases are pending B2 authoring. Source JSON and authored answer IDs/keys remain unchanged.

## References consulted

- Docker bridge/firewall: https://docs.docker.com/engine/network/packet-filtering-firewalls/ and https://docs.docker.com/engine/network/drivers/bridge/
- libvirt current vs maximum vCPU: https://libvirt.org/formatdomain.html
- GNU nproc: https://www.gnu.org/s/coreutils/manual/html_node/nproc-invocation.html (official GNU search result verified the available-to-current-process wording; full initial fetch timed out).
- Docker ps/Compose ps stopped containers: https://docs.docker.com/reference/cli/docker/container/ls/ and https://docs.docker.com/reference/cli/docker/compose/ps/
- Port publication vs EXPOSE: https://docs.docker.com/engine/network/port-publishing/
- GNU tar data integrity: https://www.gnu.org/software/tar/manual/html_node/Data-corruption-and-repair.html

Panel, billing, backup task outputs are fictional application records supplied by TicketSim. They are reviewed for internal consistency, dates, authority and limits; they are not claims about the policy or CLI of a real provider.

## B2 review: 32/32 cases

Đã đọc source ticket và evidence theo từng case, viết lại câu hỏi, phương án, feedback, gợi ý, mô tả command và sáu trường đáp án Guided. Đây là rà soát của agent trên dữ liệu và tài liệu tham khảo, chưa phải thử lệnh trực tiếp trên VPS hoặc chứng nhận độc lập của chuyên gia Linux. 32/32 case có ghi chú kỹ thuật và biên tập riêng.

| Ticket | Trạng thái | Kiểm tra kỹ thuật | Biên tập |
|---|---|---|---|
| VPS-11-001 | Đã đọc, đã sửa | Tách quota target khỏi dung lượng guest; không xem failed task hoặc catalog entry là backup đã kiểm chứng. Giữ nguyên output panel được biên soạn. | Viết lại đủ năm câu, 15 phương án/feedback, ba hint và toàn bộ giải thích phép kiểm tra; diễn giải backup bằng tiếng Việt. |
| VPS-11-002 | Đã đọc, đã sửa | Tính 56 giờ; catalog không đủ cam kết PITR; tìm nguồn khác trước kết luận mất dữ liệu. | Tách restore với backup mới; câu hỏi dùng hai mốc thực. |
| VPS-11-003 | Đã đọc, đã sửa | Một hash không là kiểm tra toàn vẹn đạt; output question không đòi kết luận baseline khi G1 chưa bắt buộc; tar -t không bảo đảm file data integrity. | Phân biệt file tồn tại, đọc được cấu trúc và so checksum. |
| VPS-11-004 | Đã đọc, đã sửa | Kho host khác guest; active chains cần operator đánh giá. | Prompt dùng task và số 99,9%, feedback phân biệt các lớp storage. |
| VPS-11-005 | Đã đọc, đã sửa | Thay lsblk pseudo-stdout bằng bảng; available/catalog chưa là kiểm tra toàn vẹn đạt. | Dùng scope vda/vdb và vol-72 cụ thể. |
| VPS-11-006 | Đã đọc, đã sửa | 60 giờ không là số giao dịch mất; binlog pending chưa bảo đảm PITR; boot khác order integrity. | Câu hỏi xoay quanh timestamp và order thay nhãn RPO mơ hồ. |
| VPS-11-007 | Đã đọc, đã sửa | Không thu secret; key ID hỗ trợ mismatch; chuẩn hóa prefix journal giữ key-rejected event. | Câu và feedback phân biệt metadata, secret, kết quả backup. |
| VPS-11-008 | Đã đọc, đã sửa | Cùng IP panel chưa đủ nếu không network-active; giữ ARP/attachment và không tắt production. | Đặt lựa chọn quanh clone/production thay generic close. |
| VPS-12-001 | Đã đọc, đã sửa | Billing success khác provisioning success; pool 0 không là guest profile issue. | Giải thích cấp phát cho L0, không đưa khách tới SSH trước VM ready. |
| VPS-12-002 | Đã đọc, đã sửa | Panel timestamp khác host current; running không chứng minh guest services; giữ hypervisor context. | Câu hỏi tập trung mâu thuẫn 50 phút thay power action. |
| VPS-12-003 | Đã đọc, đã sửa | os-release cần assignment mỗi dòng; sai OS không cho quyền reinstall. | Tách order–guest–audit và dữ liệu khách trong câu hỏi. |
| VPS-12-004 | Đã đọc, đã sửa | Sửa cách diễn giải nproc: CPU sẵn dùng cho tiến trình, không đồng nhất tuyệt đối với CPU online của cả VM. Tách current/max vCPU và task pending; giữ nguyên đáp án và output. | Thay prompt chung bằng phép đối chiếu plan–guest–host; feedback mỗi lựa chọn nói đúng lớp dữ liệu. |
| VPS-12-005 | Đã đọc, đã sửa | 40 phút không tự là hung job; progress 2 phút và safety gate phải giữ. | Lựa chọn phân biệt wait, stuck, authorized destructive action. |
| VPS-12-006 | Đã đọc, đã sửa | IP mismatch chưa là cross-tenant; chuẩn hóa ip addr, giữ subnet/address gốc. | Phân biệt order/live/ownership/gateway trong từng câu. |
| VPS-12-007 | Đã đọc, đã sửa | 403 không đồng nghĩa VM off; scope hẹp và owner đều cần; không reboot tự ý để verify. | Phân biệt tác vụ đọc/mutation, token metadata/secret. |
| VPS-12-008 | Đã đọc, đã sửa | Không login record chưa là rỗng; retry completed twice hỗ trợ duplicate không chứng minh nguyên nhân code. | Các phương án quanh identity/data/billing khác nhau. |
| VPS-13-001 | Đã đọc, đã sửa | Chuẩn hóa docker ps và Python exception, không xem exit 1 là daemon corruption. | Câu riêng về api/appconfig; đúng label ngắn, giải thích ở feedback. |
| VPS-13-002 | Đã đọc, đã sửa | Giữ rỗng stdout thật; EXPOSE khác publish, PortBindings không suy app health. | Ba lớp container–host–proxy có câu và distractor riêng. |
| VPS-13-003 | Đã đọc, đã sửa | Sửa ý định không được chứng minh: loopback observed, không khẳng định intentionally bound; public khác local. | Câu hỏi dùng chính 127.0.0.1/200 và proxy. |
| VPS-13-004 | Đã đọc, đã sửa | OOM event khác leak hoặc sole limit-cause; stats snapshot không peak. | Câu hỏi phân biệt event, usage, configuration và action. |
| VPS-13-005 | Đã đọc, đã sửa | getent dùng NSS, không chỉ DNS; rỗng chưa NXDOMAIN; sửa host entry format thêm hostname. | Prompt dùng scope host/container và giới hạn kết luận. |
| VPS-13-006 | Đã đọc, đã sửa | Tách route container, IPv4 forwarding, NAT và firewall; không cam kết bật ip_forward chữa mọi lớp. Kiểm tra Docker bridge docs và iptables/nftables forwarding caveat. | Viết lại đủ sáu câu theo đường đi gói và ranh giới quyền; hint tăng dần theo container→host→policy. |
| VPS-13-007 | Đã đọc, đã sửa | Sửa Compose ps cần--all để show DB Exited; OOM snapshot không chứng minh host RAM sole cause; chuẩn hóa free header. | Tách API db dependency, không cho API Up=resolved. |
| VPS-13-008 | Đã đọc, đã sửa | Tag không là immutable artifact; data migration unknown chặn cam kết rollback. | Các câu tách correlation, config error, release compatibility. |
| VPS-14-001 | Đã đọc, đã sửa | Payment snapshot khác việc khách đã gửi tiền; không dùng reboot hoặc SSH để bypass billing hold. | Tách đình chỉ, hóa đơn và settlement bằng câu cụ thể. |
| VPS-14-002 | Đã đọc, đã sửa | Settled event khác event delivery; reconciliation cần idempotency, không thu lại. | Câu hỏi gắn Paid/Waiting/pay-2202 thay generic state. |
| VPS-14-003 | Đã đọc, đã sửa | End-of-term không là immediate deletion; policy không tự tạo request. | Câu hỏi tập trung mốc 15/11 và hậu quả dữ liệu. |
| VPS-14-004 | Đã đọc, đã sửa | Không suy eligibility từ 7 ngày; không default approve/deny; request chưa gửi. | Phân biệt dữ kiện, điều khoản, quyết định. |
| VPS-14-005 | Đã đọc, đã sửa | Free nhưng reserved không là available for all; addon active khác guest IP. | Câu hỏi phân biệt entitlement, review, assignment. |
| VPS-14-006 | Đã đọc, đã sửa | Expired khác deleted; request khác applied hold; pending restore không bảo đảm dữ liệu. | Câu hỏi theo deadline và authority, không generic warning. |
| VPS-14-007 | Đã đọc, đã sửa | Two lines khác double charge; g1 single charge 2 plan; tax/refund phải reconcile. | Dùng invoice/order/payment/VM để kiểm tra 4 khái niệm. |
| VPS-14-008 | Đã đọc, đã sửa | Lý do abuse khác nonpayment; received khác approved; giữ ranh giới security-lead và không cam kết ETA hoặc resolved từ escalation. Các panel field là dữ liệu tình huống, không phải chính sách nhà cung cấp thật. | Bỏ lộ lý do abuse khỏi đáp án triage trước điều tra; dùng tiếng Việt cho đình chỉ, hồ sơ, chuyển cấp. |

Các sửa fixture có lý do trong từng review.fixtureChanges và báo cáo Phase B tổng hợp. docker compose ps --all cần để hiển thị DB đã dừng; docker compose ps cũ không được dùng làm alias cho output đó. VPS-13-002/P2 và VPS-13-005/P1 có stdout rỗng được khai báo từ trước trong Guided builder; giải thích nằm ngoài output. VPS-11-005/P2 dùng bảng lsblk đã biên soạn thay dòng mô tả nguồn.

Rà lại nhãn đáp án: lựa chọn đúng dài nhất duy nhất giảm từ 71/128 còn 50/128 câu có một đáp án đúng trong nhóm này. Chi tiết điều kiện xử lý an toàn được giữ trong feedback và đáp án tham khảo. Nhãn vẫn cần được đọc theo ngữ nghĩa, không lấy độ dài làm tiêu chuẩn chất lượng.
