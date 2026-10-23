# Phase B — Review topics 01–05

Rà soát bằng cách đọc từng source customer message, command/output, câu hỏi, key và feedback; không đánh đồng schema validation với technical/editorial review. Người thực hiện là agent nội dung, không có xác nhận SME con người.

## Batch B1 samples

| ID | Topic | Level | Technical / editorial | Thay đổi |
|---|---|---|---|---|
| VPS-01-001 | SSH | L0 | Đã đọc và sửa từng case | Đối chiếu systemctl/ss; tách trạng thái unit, listener và xác thực. Không thay đáp án hay điều kiện quyền. |
| VPS-02-006 | Network | L2 | Đã đọc và sửa từng case | Đọc ICMP theo đích/nguồn, không quy router lỗi từ hop ICMP. Giữ phân biệt TCP reachability với SSH login. |
| VPS-03-003 | Linux System & Services | L1 | Đã đọc và sửa từng case | Đối chiếu nginx -t: test cú pháp/mở file, không tự sửa và không chứng minh HTTP. Giữ key gốc. |
| VPS-04-007 | CPU, RAM & Performance | L3 | Đã đọc và sửa từng case | Sửa nhận định vmstat: báo cáo đầu là trung bình từ boot, cần dòng thứ hai để gọi là mẫu tiếp. Không định danh noisy neighbor. |
| VPS-05-007 | Disk & Filesystem | L3 | Đã đọc và sửa từng case | Giữ phân biệt ro/backup với integrity; cấm fsck mounted-rw và chuyển storage. Kiểm tra tên unit và khung systemctl output. |

## Ghi nhận từng case

### VPS-01-001

Đối chiếu systemctl/ss; tách trạng thái unit, listener và xác thực. Không thay đáp án hay điều kiện quyền.

Viết lại đủ sáu câu, từng lựa chọn, ba hint và note; giải thích command theo triệu chứng refused.

Thay fixture Guided: P2: No listener on :22 là diễn giải, không phải stdout ss; thay bằng bảng không có listener.; G2: Bổ sung tiêu đề df cho mẫu cùng dung lượng, không đổi kết luận.

Nguồn đối chiếu: [https://www.freedesktop.org/software/systemd/man/latest/systemctl.html](https://www.freedesktop.org/software/systemd/man/latest/systemctl.html), [https://man7.org/linux/man-pages/man8/ss.8.html](https://man7.org/linux/man-pages/man8/ss.8.html).

### VPS-02-006

Đọc ICMP theo đích/nguồn, không quy router lỗi từ hop ICMP. Giữ phân biệt TCP reachability với SSH login.

Sáu câu tập trung phạm vi đường đi, số đo và escalation; bỏ cấu trúc hỏi chung.

Thay fixture Guided: P1: Thay dòng mô tả Destination bằng bảng báo cáo MTR có Snt/Loss%.; P2: Thay câu 5 packets lost bằng thống kê ping transmitted/received chuẩn; tỷ lệ không đổi.

Nguồn đối chiếu: [https://github.com/traviscross/mtr/blob/master/man/mtr.8.in](https://github.com/traviscross/mtr/blob/master/man/mtr.8.in), [https://man7.org/linux/man-pages/man8/ping.8.html](https://man7.org/linux/man-pages/man8/ping.8.html).

### VPS-03-003

Đối chiếu nginx -t: test cú pháp/mở file, không tự sửa và không chứng minh HTTP. Giữ key gốc.

Rà cả pilot thủ công; viết lại năm prompt, toàn bộ feedback và giải thích mốc thay đổi.

Thay fixture Guided: P2: Thêm prefix nginx [emerg] và dòng test failed đúng dạng stderr kiểm tra cấu hình.

Nguồn đối chiếu: [https://nginx.org/en/docs/switches.html](https://nginx.org/en/docs/switches.html).

### VPS-04-007

Sửa nhận định vmstat: báo cáo đầu là trung bình từ boot, cần dòng thứ hai để gọi là mẫu tiếp. Không định danh noisy neighbor.

Sáu câu kiểm tra sự khác nhau giữa process CPU/steal, scope host và escalation.

Thay fixture Guided: G1: vmstat 1 2 phải có hai dòng số; thêm khoảng đo thứ hai và giải thích dòng since-boot.

Nguồn đối chiếu: [https://man7.org/linux/man-pages/man8/vmstat.8.html](https://man7.org/linux/man-pages/man8/vmstat.8.html), [https://man7.org/linux/man-pages/man1/top.1.html](https://man7.org/linux/man-pages/man1/top.1.html).

### VPS-05-007

Giữ phân biệt ro/backup với integrity; cấm fsck mounted-rw và chuyển storage. Kiểm tra tên unit và khung systemctl output.

Sáu câu và ba hint đi từ rescue tới bảo toàn/recovery; không chốt ổ vật lý hỏng.

Thay fixture Guided: P2: Thay mô tả unit failed bằng bảng systemctl --failed, giữ unit và trạng thái.

Nguồn đối chiếu: [https://www.freedesktop.org/software/systemd/man/latest/systemd-fsck@.service.html](https://www.freedesktop.org/software/systemd/man/latest/systemd-fsck@.service.html), [https://man7.org/linux/man-pages/man8/e2fsck.8.html](https://man7.org/linux/man-pages/man8/e2fsck.8.html).

## Giới hạn

Năm case B1 đã được biên soạn. 35 case còn lại chờ checkpoint B1 trước khi mở rộng. Đây là review kỹ thuật/editorial của agent bằng tài liệu và dữ liệu, không chạy VPS/command thật. Kiểm thử tích hợp do agent chính thực hiện.
