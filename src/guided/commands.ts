import type { CommandDoc } from './types'
import { commandRevisions } from './commandRevisions'
import { additionalCommands } from './moreCommands'
import { shellKnowledge } from './commandKnowledge'
import { supportKnowledge } from './supportKnowledge'

const examples: Record<string, [string, string, string, string[]]> = {
  'systemctl-status': ['Active: inactive (dead)', 'Khi SSH bị từ chối ở bước TCP.', 'journalctl -u sshd -n 50 --no-pager', ['VPS-01-001']],
  'ss-ltnp': ['LISTEN 0 128 0.0.0.0:22 0.0.0.0:*', 'Khi cần xác nhận cổng TCP có listener.', 'Kiểm tra firewall và kết nối từ client.', ['VPS-01-001', 'VPS-03-001', 'VPS-07-001']],
  'journalctl-unit': ['Oct 22 10:12:00 vm sshd[742]: Server listening on 0.0.0.0 port 22.', 'Khi cần tìm nguyên nhân SSH dừng hoặc lỗi khởi động.', 'sshd -t rồi đối chiếu thời điểm sự cố.', ['VPS-01-001']],
  'df-h': ['/dev/vda1 20G 8G 12G 40% /', 'Khi lỗi ghi file hoặc nghi filesystem đầy.', 'df -i / để phân biệt inode.', ['VPS-05-001', 'VPS-05-002']],
  'ssh-vvv': ['debug1: Authentications that can continue: publickey,password', 'Khi cần phân biệt kết nối và xác thực từ client.', 'getent passwd USER qua console guest.', ['VPS-01-002']],
  'getent-passwd': ['admin:x:1001:1001::/home/admin:/bin/bash', 'Khi username bị từ chối.', 'id USER và kiểm tra chính sách SSH.', ['VPS-01-002']],
  'ip-addr': ['enp0s3 UP 10.10.20.25/24', 'Khi guest không đi mạng.', 'ip route', ['VPS-02-001']],
  'ip-route': ['default via 10.10.20.1 dev enp0s3', 'Khi cần kiểm tra đường ra ngoài subnet.', 'ip route get 1.1.1.1', ['VPS-02-001']],
  'ip-route-get': ['1.1.1.1 via 10.10.20.1 dev enp0s3 src 10.10.20.25', 'Khi cần biết kernel chọn route nào cho đích cụ thể.', 'ping -c 4 1.1.1.1', ['VPS-02-001']],
  'nmcli-show': ['NAME  UUID  TYPE  DEVICE\nSystem enp0s3  ...  ethernet  enp0s3', 'Khi đối chiếu profile NetworkManager với interface.', 'nmcli device show', ['VPS-02-001']],
  'systemctl-nginx': ['Active: inactive (dead)', 'Khi web không phản hồi hoặc connection refused.', 'journalctl -u nginx -n 50 --no-pager', ['VPS-03-001', 'VPS-07-001']],
  'journalctl-nginx': ['Oct 22 10:12:00 vm nginx[921]: nginx.service: Failed with result exit-code.', 'Khi Nginx dừng hoặc start lỗi.', 'nginx -t và xem error.log.', ['VPS-03-001', 'VPS-07-001']],
  'nginx-test': ['nginx: configuration file /etc/nginx/nginx.conf test is successful', 'Trước khi đề xuất reload/start Nginx.', 'systemctl status nginx và curl -I localhost.', ['VPS-03-001', 'VPS-07-001']],
  'du-var': ['13G /var/log\n14G /var', 'Khi /var chiếm nhiều block.', 'Kiểm tra nguồn tăng trưởng; không xóa theo kích thước đơn thuần.', ['VPS-05-001']],
  'df-i': ['/dev/vda1 1310720 550502 760218 42% /', 'Khi còn GB nhưng vẫn không tạo được file.', 'Tìm nơi có nhiều file nhỏ.', ['VPS-05-002']],
  'find-files': ['/var/log/app/2026-10-22.log', 'Khi cần liệt kê file trong phạm vi hẹp.', 'Đếm theo thư mục và xác nhận loại dữ liệu.', ['VPS-05-002']],
  'curl-head': ['HTTP/1.1 200 OK\nServer: nginx', 'Khi cần kiểm tra HTTP ở một địa chỉ cụ thể.', 'Kiểm tra từ client ngoài guest.', ['VPS-07-001']],
  'dig-a': [';; ->>HEADER<<- opcode: QUERY, status: NOERROR\n;; ANSWER SECTION:\nexample.com. 300 IN A 198.51.100.20', 'Khi hostname không phân giải.', 'Đối chiếu exact FQDN và resolver khác.', ['VPS-08-002']],
  'dig-ns': ['example.com. 3600 IN NS ns1.example.net.', 'Khi cần xem NS của zone.', 'dig @ns1.example.net example.com A', ['VPS-08-002']],
  'resolvectl': ['DNS Servers: 192.0.2.53', 'Khi nghi resolver của guest.', 'dig @192.0.2.53 example.com A', ['VPS-08-002']],
  'free-h': ['Mem: 3.8Gi 1.2Gi 1.0Gi 120Mi 1.6Gi 2.3Gi', 'Khi ứng dụng chậm hoặc OOM.', 'journalctl -b -p err -n 80 --no-pager', []],
  'top': ['%Cpu(s): 12.0 us, 3.0 sy, 85.0 id', 'Khi cần ảnh chụp CPU/process.', 'vmstat 1 5', []],
  'firewall-list': ['public (active)\n  services: ssh dhcpv6-client', 'Khi nghi firewall guest chặn cổng.', 'Đối chiếu active zone và ss -ltnp.', ['VPS-01-001']],
  'getenforce': ['Enforcing', 'Khi nghi policy SELinux ảnh hưởng service.', 'ausearch -m AVC -ts recent', []],
  'docker-ps': ['CONTAINER ID  IMAGE  STATUS  PORTS\nabc123 nginx Up 2 hours 0.0.0.0:8080->80/tcp', 'Khi dịch vụ chạy trong container.', 'docker logs --tail 50 CONTAINER', []],
}
const doc = (id: string, family: string, command: string, purpose: string, interpretation: string, pitfalls: string, flags = 'Không có flag cần ghi nhớ cho ví dụ này.', context = 'guest', safety: CommandDoc['safety'] = 'read', privilege = 'user', ubuntu = command): CommandDoc => ({
  id, family, command, purpose, interpretation, pitfalls, flags, context, safety, privilege, centos: command, ubuntu,
  exampleOutput: examples[id][0], whenToUse: examples[id][1], followUp: examples[id][2], relatedTicketIds: examples[id][3],
})

export const commandLibrary: CommandDoc[] = [
  doc('systemctl-status', 'SSH', 'systemctl status sshd', 'Kiểm tra dịch vụ SSH trên VPS đang chạy, đã dừng hay gặp lỗi.', 'Dòng Active cho biết trạng thái hiện tại của sshd. Nếu inactive hoặc failed, cần xem log để tìm nguyên nhân. Active không chứng minh đăng nhập SSH từ client thành công.', 'CentOS dùng sshd; Ubuntu thường dùng ssh.', 'status là phép đọc; không thay thế start/restart.', 'guest', 'read', 'user', 'systemctl status ssh'),
  doc('ss-ltnp', 'Network', 'ss -ltnp', 'Liệt kê các cổng TCP đang mở để nhận kết nối và tiến trình liên quan (nếu đủ quyền).', 'Dòng LISTEN ở 0.0.0.0:22 cho thấy có tiến trình lắng nghe cổng 22 trên các địa chỉ IPv4 local; output này chưa xác nhận client bên ngoài kết nối được.', 'Thiếu quyền có thể không hiện tên process.', '-l listening; -t TCP; -n số cổng; -p process.', 'guest', 'read', 'user'),
  doc('journalctl-unit', 'SSH', 'journalctl -u sshd -n 50 --no-pager', 'Xem 50 bản ghi journal gần nhất liên quan tới dịch vụ SSH.', 'Log ghi sự kiện sshd lắng nghe cổng 22 tại thời điểm trong bản ghi. Cần đối chiếu thời gian lỗi và trạng thái hiện tại; đây không phải bằng chứng SSH vẫn đang chạy.', 'Cần quyền xem journal; không suy luận từ một dòng riêng lẻ.', '-u chọn unit; -n giới hạn dòng; --no-pager tránh mở pager.', 'guest', 'privileged_read', 'sudo', 'journalctl -u ssh -n 50 --no-pager'),
  doc('df-h', 'Disk', 'df -h /', 'Xem dung lượng filesystem chứa /.', 'Use% và Available phản ánh block space.', 'Có dung lượng trống vẫn có thể hết inode.', '-h hiển thị đơn vị dễ đọc.', 'guest', 'read', 'user'),
  doc('ssh-vvv', 'SSH', 'ssh -vvv user@IP', 'Hiển thị thông tin debug để xác định SSH lỗi ở bước kết nối, kiểm tra host key hay xác thực.', 'Dòng Authentications that can continue cho biết các phương thức xác thực server đang cho phép. Nó không tự chứng minh mật khẩu hoặc SSH key của client đã đúng.', 'Output có thể lộ thông tin môi trường; không dán secret.', '-vvv tăng mức debug.', 'client', 'read', 'user'),
  doc('getent-passwd', 'SSH', 'getent passwd USER', 'Tra account theo tên qua Name Service Switch (NSS) của guest.', 'Dòng admin:x:... xác nhận lookup tên admin có entry; không xác nhận đăng nhập SSH.', 'Không tạo hoặc reset user nếu chưa được phép; nguồn danh tính có thể là local hoặc remote.', 'passwd là cơ sở dữ liệu NSS; USER là tên cần tra.', 'guest', 'read', 'user'),
  doc('ip-addr', 'Network', 'ip -br addr', 'Liệt kê interface và địa chỉ IP được cấu hình trên VPS theo dạng ngắn gọn.', 'Dòng enp0s3 UP 10.10.20.25/24 cho thấy interface có địa chỉ IPv4 này. UP chưa chứng minh có default route hoặc kết nối Internet.', 'Có IP không chứng minh có default route.', '-br là dạng brief.', 'guest', 'read', 'user'),
  doc('ip-route', 'Network', 'ip route', 'Xem các tuyến IPv4, gồm đường mặc định dùng để ra ngoài mạng nội bộ.', 'Output mẫu có default route qua 10.10.20.1; route tồn tại chưa chứng minh đích ngoài mạng truy cập được.', 'Cần biết gateway được cấp trước khi thay đổi route.', 'Không có flag trong ví dụ.', 'guest', 'read', 'user'),
  doc('ip-route-get', 'Network', 'ip route get 1.1.1.1', 'Kiểm tra kernel sẽ chọn interface, gateway và source IP nào để tới một địa chỉ đích; lệnh không gửi gói tin.', 'Kết quả cho biết next hop/interface hoặc lỗi route.', 'Một route tồn tại chưa chứng minh kết nối TCP thực sự hoạt động.', 'get tra quyết định định tuyến.', 'guest', 'read', 'user'),
  doc('nmcli-show', 'Network', 'nmcli connection show', 'Xem NetworkManager profiles.', 'Tên profile và trạng thái hỗ trợ kiểm tra cấu hình mạng.', 'Không dùng connection down khi chỉ cần đọc.', 'show là phép đọc.', 'guest', 'read', 'user'),
  doc('systemctl-nginx', 'Web', 'systemctl status nginx', 'Kiểm tra Nginx đang chạy, đã dừng hay bị lỗi trên VPS.', 'inactive nghĩa là unit không đang chạy; cần xem log và kiểm tra HTTP trước khi kết luận website đã hoạt động.', 'VPS running không đồng nghĩa web service đang chạy.', 'status là phép đọc.', 'guest', 'read', 'user'),
  doc('journalctl-nginx', 'Web', 'journalctl -u nginx -n 50 --no-pager', 'Đọc log service Nginx.', 'Log giúp tìm lỗi khởi động hay cấu hình.', 'Cần đối chiếu thời gian lỗi với ticket.', '-u chọn unit; -n 50 giới hạn dòng.', 'guest', 'privileged_read', 'sudo'),
  doc('nginx-test', 'Web', 'nginx -t', 'Kiểm tra cú pháp cấu hình Nginx.', 'syntax is ok hỗ trợ bước tiếp theo nhưng không chứng minh site hoạt động.', 'Một cấu hình hợp lệ vẫn có thể trỏ sai upstream.', '-t chỉ kiểm tra cấu hình.', 'guest', 'privileged_read', 'sudo'),
  doc('du-var', 'Disk', 'du -xhd1 /var', 'Tìm thư mục lớn dưới /var trong cùng filesystem.', 'Chỉ ra nơi chiếm dung lượng để tiếp tục điều tra.', 'Không xóa log trực tiếp chỉ vì thấy thư mục lớn.', '-x cùng filesystem; -h dễ đọc; -d1 một cấp.', 'guest', 'read', 'user'),
  doc('df-i', 'Disk', 'df -i /', 'Xem số inode đã dùng của filesystem /.', 'IUse% 100% giải thích lỗi tạo file dù còn GB.', 'Phân biệt inode với block space của df -h.', '-i xem inode.', 'guest', 'read', 'user'),
  doc('find-files', 'Disk', 'find /var -xdev -type f', 'Liệt kê file để điều tra số lượng file nhỏ.', 'Dòng mẫu chỉ chứng minh một file được liệt kê; cần đếm theo thư mục trước khi quy inode exhaustion cho nhiều file.', 'Output có thể rất lớn; giới hạn và thu hẹp phạm vi khi thực hành thật.', '-xdev không qua filesystem khác; -type f chỉ file.', 'guest', 'read', 'user'),
  doc('curl-head', 'Web', 'curl -I http://127.0.0.1', 'Kiểm tra HTTP response từ localhost.', 'Status và header cho thấy web server có phản hồi tại đích kiểm tra.', 'Localhost thành công chưa chứng minh truy cập ngoài Internet.', '-I chỉ lấy header.', 'guest', 'read', 'user'),
  doc('dig-a', 'DNS', 'dig example.com A', 'Hỏi DNS A record của tên miền.', 'ANSWER SECTION và status cho biết kết quả từ resolver được hỏi.', 'Một resolver không đại diện cho toàn bộ người dùng.', 'A chọn loại record IPv4.', 'client', 'read', 'user'),
  doc('dig-ns', 'DNS', 'dig example.com NS', 'Xem nameserver của zone.', 'NS record giúp kiểm tra nơi ủy quyền DNS.', 'Phân biệt authoritative nameserver với resolver cache.', 'NS chọn loại record nameserver.', 'client', 'read', 'user'),
  doc('resolvectl', 'DNS', 'resolvectl status', 'Xem resolver mà máy đang dùng.', 'DNS server hiện cấu hình giúp khoanh vùng lỗi phân giải.', 'Cấu hình resolver không chứng minh bản ghi tồn tại.', 'status là phép đọc.', 'guest', 'read', 'user'),
  doc('free-h', 'Performance', 'free -h', 'Xem bộ nhớ và swap.', 'available phản ánh bộ nhớ có thể dùng tốt hơn cột free.', 'Không kết luận thiếu RAM chỉ từ một ảnh chụp.', '-h dùng đơn vị dễ đọc.', 'guest', 'read', 'user'),
  doc('top', 'Performance', 'top -b -n 1', 'Lấy một ảnh chụp CPU và process.', 'So sánh tải CPU, memory và process nổi bật.', 'Ảnh chụp một thời điểm có thể bỏ lỡ sự cố ngắt quãng.', '-b batch; -n 1 một lần.', 'guest', 'read', 'user'),
  doc('firewall-list', 'Security', 'firewall-cmd --list-all', 'Xem zone/firewall rules hiện áp dụng.', 'Port hoặc service bị chặn là một giả thuyết cần đối chiếu.', 'Không mở port trên production khi chưa có quyền.', '--list-all là phép đọc.', 'guest', 'privileged_read', 'sudo'),
  doc('getenforce', 'Security', 'getenforce', 'Xem SELinux mode.', 'Enforcing cho biết policy đang áp dụng.', 'Không dùng setenforce 0 làm cách sửa lâu dài.', 'Không có flag trong ví dụ.', 'guest', 'read', 'user'),
  doc('docker-ps', 'Docker', 'docker ps -a', 'Xem container đang chạy và đã dừng.', 'STATUS hỗ trợ phân biệt container stopped/restarting.', 'Quyền Docker tương đương quyền mạnh trên host; chỉ dùng khi được cấp.', '-a gồm container đã dừng.', 'guest', 'privileged_read', 'sudo'),
  ...additionalCommands,
].map(card => {
  const revised = { ...card, ...commandRevisions[card.id] }
  return { ...revised, knowledge: revised.context === 'panel' ? supportKnowledge(revised) : shellKnowledge(revised) }
})
