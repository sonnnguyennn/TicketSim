# VPS Support Ticket Lab — dữ liệu nền tảng giả lập

## Files
- `VPS_Ticket_Lab_112.xlsx`: bảng tính 112 tickets (14 topic) + đáp án + playbook + CentOS commands + topic counts.
- `tickets.json`: dữ liệu chuẩn cho coding agent; **nên sử dụng tệp này để triển khai website**.
- `tickets.csv`: CSV UTF-8 BOM, có trường `probe_outputs_json` dạng nested JSON string.
- `ticket_schema.json`: JSON Schema để validate đầu vào.
- `command_cheatsheet.csv`: lookup commands CentOS Stream 9.
- `AGENT_BUILD_SPEC.md`: yêu cầu sản phẩm + tiêu chí nghiệm thu website.

## Kết cấu / cấu hình
- 14 topic x 8 ticket = **112 cases**, trong đó 12 topic chính có 96 cases, thêm Docker và Billing mỗi topic 8 cases.
- 4 cấp độ, mỗi topic có 2 case / level: L0 nhận diện, L1 kiểm tra, L2 chẩn đoán/phân quyền, L3 vấn đề nâng cao/hạ tầng.
- Đây là 112 case **sáng tác để học**, không phải trích xuất từ ticket thật hoặc số liệu tần suất đã được đo.
- Mỗi case chứa ticket tiếng Anh, 2 command probes và output giả lập, gợi ý, diagnosis, next checks, resolution, verification, escalation.

## Cách dùng đề xuất
1. Coding agent đọc `AGENT_BUILD_SPEC.md` và `tickets.json`.
2. Xây trình duyệt ticket có bộ lọc Topic/Level và nút Open.
3. Không hiển thị đáp án ngay; cho người học nhập command, trả `stdout` matching fixtures.
4. Người học nhập phân tích và hướng giải quyết; bấm Submit để hiện rubric/answer (không nhất thiết có AI chấm ngay).
5. Dùng case L0-L1 để tra sổ, L2-L3 để luyện quyết định escalation.

## Important safety
- Không chạy command người học nhập trên host/server/browser, đặc biệt không chạy shell tùy ý. Terminal là **simulator**, không phải real SSH.
- Nếu bổ sung live VM labs, đặt thành chế độ riêng có snapshot/console, giới hạn mạng và quyền.
- Không dùng mật khẩu, SSH keys hoặc IP khách hàng thực. Các IP trong dataset thuộc dải tài liệu (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24, 2001:db8::/32) khi cần địa chỉ minh họa.

## Tài liệu tham khảo nền CentOS
- https://www.centos.org/cl-vs-cs/
- https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html-single/configuring_and_managing_networking/index
