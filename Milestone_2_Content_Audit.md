# Kiểm tra nội dung Guided — Milestone 2 và đợt mở rộng L1

| Ticket | Kết luận được bằng chứng hỗ trợ | Điều chưa được kết luận | Điều chỉnh Milestone 2 |
|---|---|---|---|
| VPS-01-001 | `sshd` inactive và không có listener TCP/22. | Vì sao service dừng. | Thêm bài sắp xếp quan sát → log/config → quyền → xác minh; gợi ý cuối chỉ mở sau probe. |
| VPS-01-002 | SSH đã tới xác thực; `admin` không có account entry trong fixture. | Mật khẩu của account hợp lệ sai. | Giữ phản hồi phân biệt authentication với kết nối TCP. |
| VPS-02-001 | Guest có IP trong subnet; bảng route thiếu default. | Gateway đúng hay upstream hỏng. | Mục tiêu không tiết lộ đáp án trước probe; thêm thứ tự điều tra và rollback. |
| VPS-03-001 | VM running không chứng minh Nginx chạy; service inactive và :80 không listen. | Nguyên nhân Nginx dừng. | Output `nginx -t` bổ sung dạng hai dòng thực tế; không coi syntax OK là site OK. |
| VPS-05-001 | Root filesystem 100% block; `/var/log` chiếm phần lớn. | File nào được phép xóa; nguồn tăng trưởng. | Thêm bài sắp xếp kiểm tra/duyệt/xác minh; thẻ `journalctl --disk-usage` riêng. |
| VPS-05-002 | Block còn chỗ, inode 100%. | Thư mục/file nào cần dọn. | Giữ phân biệt inode với block; command đếm file chỉ hỗ trợ khoanh vùng. |
| VPS-07-001 | Nginx inactive, không có listener :80, local HTTP refused. | Nguyên nhân service dừng; HTTP ngoài sau khi sửa. | Bổ sung output `nginx -t` thực tế; giải thích TCP refused khác HTTP status. |
| VPS-08-002 | `ww.example.com` NXDOMAIN; `www.example.com` có A record. | Toàn zone hay web server hỏng. | Thêm customer follow-up ghi rõ exact FQDN; thêm thứ tự xác nhận tên trước khi sửa DNS. |

## Bốn case L1 được biên soạn tiếp

| Ticket | Điều fixture chứng minh | Điều chưa thể kết luận | Quyết định học tập |
|---|---|---|---|
| VPS-01-003 | SSH client cảnh báo private key 0644; `ls -l` xác nhận group/others đọc được. | Trạng thái sshd và account trong guest. | Chỉ đề xuất bảo vệ key trên client; không chia sẻ private key hoặc restart guest. |
| VPS-03-003 | Nginx failed; `nginx -t` báo dấu `}` bất ngờ trong `nginx.conf:45`. | Ai sửa file, HTTP đã phục hồi sau sửa. | Đối chiếu diff/backup, sửa có quyền, kiểm tra syntax trước service và HTTP. |
| VPS-05-004 | `/data` là mount `ro`; kernel ghi nhận Buffer I/O error trên vdb. | Ổ vật lý/host nào hỏng hoặc dữ liệu còn nguyên vẹn. | Ngừng ghi, bảo vệ backup và escalation storage; không remount rw để thử. |
| VPS-08-003 | Một truy vấn NS trả old-dns; panel ghi zone new-dns đã chỉnh. | Delegation tại registrar hiện thế nào và A record authoritative ra sao. | Kiểm tra registrar/authoritative trực tiếp trước khi đề xuất đổi NS. |

Hai source probe của mỗi ticket vẫn là fixture gốc. Tám pilot có hai supplement được biên soạn; bốn case L1 dùng đúng hai source probe vì đó là lượng bằng chứng có thể kiểm định hiện tại. Câu hỏi, feedback và hint nằm trong `scripts/guided-content.mjs`; đáp án đầy đủ tách khỏi payload công khai. Một số output source là tóm tắt thay vì console đầy đủ; phần giải thích trong UI nói rõ giới hạn suy luận. Không có hành động thay đổi guest hoặc xác minh sau sửa bằng output mới.
