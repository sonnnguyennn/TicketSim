// Hand-authored learning content. The build script splits prompts from answer keys.
import { readFileSync } from 'node:fs'
const q = (id, stage, kind, prompt, options, correctIds, explanation, commandId, requiredProbeIds) => ({
  id, stage, kind, prompt,
  options: options.map(([id, label, feedback]) => ({ id, label, feedback })),
  correctIds, explanation, commandId, requiredProbeIds,
})

export const guidedContent = [
  {
    id: 'VPS-01-001',
    objective: 'Phân biệt lỗi kết nối TCP với lỗi xác thực SSH; dùng trạng thái service và cổng lắng nghe làm bằng chứng.',
    hints: ['Lỗi xảy ra trước hay sau khi nhập thông tin đăng nhập?', 'Trong guest, hãy kiểm tra trạng thái sshd và cổng TCP/22.', 'Dùng systemctl status sshd, rồi ss -ltnp; giải thích điều mỗi output thực sự chứng minh.'],
    probeNotes: [
      { purpose: 'Kiểm tra SSH daemon có đang chạy trong guest không.', meaning: 'inactive (dead) chỉ nói sshd hiện không chạy; chưa cho biết nguyên nhân dừng.', commandId: 'systemctl-status', aliases: ['sudo systemctl status sshd'] },
      { purpose: 'Xem các cổng TCP đang lắng nghe.', meaning: 'Không có listener ở :22 phù hợp với lỗi connection refused.', commandId: 'ss-ltnp', aliases: ['sudo ss -ltnp'] },
    ],
    extras: [
      { command: 'journalctl -u sshd -n 50 --no-pager', output: '-- No entries --', purpose: 'Tìm log gần đây của SSH service.', meaning: 'Fixture không có log bổ sung; chưa thể kết luận vì sao service dừng.', commandId: 'journalctl-unit', aliases: ['sudo journalctl -u sshd -n 50 --no-pager'] },
      { command: 'df -h /', output: '/dev/vda1 20G 8G 12G 40% /', purpose: 'Loại trừ tình huống root filesystem đầy.', meaning: 'Ổ đĩa còn chỗ; đây không phải bằng chứng trực tiếp cho nguyên nhân SSH dừng.', commandId: 'df-h', aliases: [] },
      { command: 'systemctl status sshd', output: 'Active: active (running)', purpose: 'Xác minh SSH daemon sau hành động mô phỏng.', meaning: 'Service active; vẫn cần kiểm tra listener và đường kết nối từ client.', commandId: 'systemctl-status', aliases: ['sudo systemctl status sshd'], requiredState: ['changed'] },
      { command: 'ss -ltnp', output: 'LISTEN 0 128 0.0.0.0:22 users:(("sshd",pid=724,fd=3))', purpose: 'Xác minh listener TCP/22 sau hành động.', meaning: 'Guest đã lắng nghe ở :22; điều này chưa chứng minh client đăng nhập thành công.', commandId: 'ss-ltnp', aliases: ['sudo ss -ltnp'], requiredState: ['changed'] },
      { command: 'ssh -o BatchMode=yes admin@192.0.2.25', output: 'Permission denied (publickey,password).', purpose: 'Kiểm tra SSH từ client sau hành động mà không nhập mật khẩu.', meaning: 'Đường kết nối đã đi tới xác thực nhưng tài khoản/khóa vẫn cần kiểm tra; chưa thể báo khách đăng nhập được.', commandId: 'ssh-vvv', aliases: [], context: 'client', requiredState: ['changed'] },
    ],
    simulation: { states: ['initial', 'changed'], verificationProbeIds: ['G3', 'G4', 'G5'], transitions: [
      { actionId: 'start', commandId: 'systemctl-start', label: 'Start sshd sau khi xác nhận quyền', from: 'initial', to: 'changed', requiredProbeIds: ['P1', 'P2', 'G1'], context: 'guest', safety: 'change', requiresApproval: true, allowed: true, output: 'SIMULATED: systemctl start sshd accepted. State changed; outcome must be checked with fresh probes.', feedback: 'Đã mô phỏng start sau bằng chứng và xác nhận quyền. Không coi ticket là giải quyết cho đến khi kiểm tra lại từ guest và client.' },
      { actionId: 'reboot', label: 'Reboot VPS để thử vận may', from: 'initial', to: 'initial', requiredProbeIds: [], context: 'panel', safety: 'change', requiresApproval: true, allowed: false, output: 'SIMULATED: action blocked; VM state unchanged.', feedback: 'Reboot ảnh hưởng toàn VPS và chưa có bằng chứng cần thiết. Ưu tiên service cụ thể.', category: 'unsafe_action' },
    ] },
    verificationPrompt: 'Viết 2–3 dòng: hiện tượng, bằng chứng đã quan sát, bước kiểm tra hoặc xử lý an toàn tiếp theo và cách xác minh.',
    questions: [
      q('triage', 'triage', 'single_choice', 'Khách hàng đang báo hiện tượng nào?', [
        ['auth', 'SSH từ chối mật khẩu', 'Khách hàng chưa đi tới bước xác thực.'],
        ['refused', 'Kết nối TCP tới SSH bị từ chối', 'Đúng: “Connection refused” là lỗi ở bước thiết lập kết nối.'],
        ['dns', 'Tên miền không phân giải', 'Ticket không nhắc tới lỗi DNS.'],
      ], ['refused'], 'Trước khi tìm nguyên nhân, hãy phân biệt connection refused với permission denied.'),
      q('check', 'investigate', 'command_choice', 'Trong guest console, phép kiểm tra nào trực tiếp nhất để bắt đầu?', [
        ['service', 'systemctl status sshd', 'Đúng: xem daemon có đang hoạt động.'],
        ['disk', 'df -h /', 'Lệnh hợp lệ nhưng chưa trực tiếp với triệu chứng SSH.'],
        ['dns', 'dig example.com A', 'DNS không phải dấu hiệu nổi bật ở ticket này.'],
      ], ['service'], 'Ưu tiên một phép đọc trạng thái service trước khi đề xuất thay đổi.', 'systemctl-status'),
      q('output', 'interpret', 'output_interpretation', 'Output “Active: inactive (dead)” chứng minh điều gì?', [
        ['stopped', 'sshd hiện không chạy', 'Đúng: đây là trạng thái hiện tại.'],
        ['cause', 'Đã biết chính xác lý do sshd dừng', 'Trạng thái service không nêu nguyên nhân; cần log.'],
        ['host', 'Máy chủ vật lý chắc chắn bị tắt', 'Guest vẫn có thể hoạt động khi một service dừng.'],
      ], ['stopped'], 'Quan sát “inactive” là bằng chứng; nguyên nhân dừng vẫn là điều chưa biết.', 'systemctl-status', ['P1']),
      q('evidence', 'interpret', 'multi_select', 'Chọn các kết luận được hai output hiện có hỗ trợ.', [
        ['inactive', 'sshd đang inactive', 'Đúng: P1 ghi rõ inactive.'],
        ['noport', 'Không có listener ở TCP/22', 'Đúng: P2 không thấy listener.'],
        ['why', 'Cấu hình SSH sai là nguyên nhân đã xác nhận', 'Chưa có log hoặc kiểm tra cấu hình để xác nhận.'],
        ['disk', 'Root filesystem đã đầy', 'Hai probe chính không đo dung lượng; cần df -h để đánh giá.'],
      ], ['inactive', 'noport'], 'Nêu đúng điều output chứng minh, không suy diễn nguyên nhân.', 'ss-ltnp', ['P1', 'P2']),
      q('decision', 'decide', 'single_choice', 'Bước tiếp theo an toàn nhất là gì?', [
        ['restart', 'Restart sshd ngay trên VPS khách hàng', 'Thay đổi service cần kiểm tra nguyên nhân và quyền hạn trước.'],
        ['logs', 'Xem log, xác nhận quyền; chỉ đề xuất start nếu được phép, rồi kiểm tra lại SSH', 'Đúng: điều tra nguyên nhân và xác minh sau hành động.'],
        ['ignore', 'Kết luận do khách nhập sai mật khẩu', 'Connection refused xảy ra trước xác thực.'],
      ], ['logs'], 'Chỉ mô phỏng start khi đã xem bằng chứng, kiểm tra log và xác nhận quyền; sau đó phải xác minh lại.', 'journalctl-unit'),
      q('sequence', 'decide', 'step_order', 'Sắp xếp quy trình xử lý SSH an toàn.', [
        ['status', 'Ghi nhận service và listener hiện tại', 'Đầu tiên giữ bằng chứng trạng thái trước mọi thay đổi.'],
        ['logs', 'Xem log và kiểm tra cấu hình để tìm nguyên nhân', 'Điều tra nguyên nhân sau khi xác nhận triệu chứng.'],
        ['approve', 'Xác nhận quyền rồi mới đề xuất start nếu phù hợp', 'Không thay đổi service trước khi có quyền.'],
        ['verify', 'Kiểm tra lại listener và SSH từ client', 'Xác minh kết quả sau hành động được duyệt.'],
      ], ['status', 'logs', 'approve', 'verify'], 'Trình tự là quan sát → điều tra → xin phép hành động → xác minh.', 'journalctl-unit', ['P1', 'P2']),
    ],
  },
  {
    id: 'VPS-01-002',
    objective: 'Phân biệt Permission denied với lỗi mạng và kiểm tra username trước khi đề xuất thay đổi account.',
    hints: ['Connection đã tới bước xác thực hay chưa?', 'Kiểm tra tên user trong debug SSH và cơ sở dữ liệu account.', 'Đối chiếu ssh -vvv với getent passwd admin; xác nhận user hợp lệ với khách.'],
    probeNotes: [
      { purpose: 'Xem bước xác thực SSH từ client.', meaning: 'Đã tới xác thực, nên đây không phải lỗi không kết nối tới port.', commandId: 'ssh-vvv', context: 'client', aliases: [] },
      { purpose: 'Tra username admin trong account database.', meaning: 'Không có entry cho admin trong fixture này.', commandId: 'getent-passwd', aliases: [] },
    ],
    extras: [
      { command: 'id admin', output: 'id: admin: no such user', purpose: 'Kiểm chứng username admin có tồn tại không.', meaning: 'Username được dùng hiện không tồn tại trong guest mô phỏng.', commandId: 'getent-passwd', aliases: [] },
      { command: 'systemctl status sshd', output: 'Active: active (running)', purpose: 'Kiểm tra SSH daemon đang chạy.', meaning: 'Service đang chạy; không chứng minh thông tin đăng nhập đúng.', commandId: 'systemctl-status', aliases: ['sudo systemctl status sshd'] },
    ],
    verificationPrompt: 'Ghi hiện tượng xác thực, bằng chứng về username, bước xác nhận với khách và cách kiểm tra đăng nhập sau đó.',
    questions: [
      q('triage', 'triage', 'single_choice', 'Khách hàng gặp lỗi ở giai đoạn nào?', [['network', 'Không tới được cổng SSH', 'Permission denied cho thấy đã tới bước xác thực.'], ['auth', 'Xác thực SSH bị từ chối', 'Đúng: kết nối đã qua bước TCP.'], ['dns', 'DNS phân giải sai', 'Ticket không nêu lỗi DNS.']], ['auth'], 'Phân biệt lỗi kết nối với lỗi xác thực.'),
      q('check', 'investigate', 'command_choice', 'Muốn xác minh username admin có tồn tại, nên chọn gì?', [['getent', 'getent passwd admin', 'Đúng: tra nguồn danh tính của hệ thống.'], ['route', 'ip route', 'Route không kiểm tra account.'], ['restart', 'systemctl restart sshd', 'Restart là thay đổi không cần thiết và không kiểm tra username.']], ['getent'], 'Kiểm tra account bằng phép đọc trước khi đề xuất thay đổi.', 'getent-passwd'),
      q('output', 'interpret', 'output_interpretation', 'Output “getent passwd admin → no entry” nghĩa là gì?', [['missing', 'Không tìm thấy username admin', 'Đúng với dữ liệu fixture.'], ['password', 'Mật khẩu admin chắc chắn sai', 'Chưa thể đánh giá mật khẩu của user không tồn tại.'], ['port', 'Port 22 bị chặn', 'Output về account không kiểm tra port.']], ['missing'], 'Lệnh trả về tình trạng username, không phải mật khẩu.', 'getent-passwd', ['P2']),
      q('evidence', 'interpret', 'multi_select', 'Bằng chứng nào được output hỗ trợ?', [['reached', 'SSH đã tới bước xác thực', 'Đúng từ debug SSH.'], ['missing', 'admin không có account entry', 'Đúng từ getent.'], ['firewall', 'Firewall đang chặn port 22', 'Không phù hợp với việc đã tới xác thực.'], ['wrongpw', 'Mật khẩu của account hợp lệ bị sai', 'Chưa có bằng chứng về một account hợp lệ.']], ['reached', 'missing'], 'Không đồng nhất Permission denied với sai mật khẩu.', 'ssh-vvv', ['P1', 'P2']),
      q('decision', 'decide', 'single_choice', 'Hướng xử lý an toàn nhất là gì?', [['valid', 'Xác nhận username được phép, thử lại bằng account hợp lệ', 'Đúng: không tự tạo/reset account.'], ['create', 'Tạo account admin ngay', 'Tạo account là thay đổi cần phê duyệt.'], ['reboot', 'Reboot VPS', 'Không có bằng chứng cần reboot.']], ['valid'], 'Dùng account hợp lệ và xác minh login; chuyển cấp nếu cần thay đổi account.', 'getent-passwd'),
    ],
  },
  {
    id: 'VPS-02-001',
    objective: 'Phân biệt IP, route và kết nối thực tế khi guest chỉ liên lạc được trong subnet.',
    hints: ['VPS có IP nhưng có đường ra ngoài subnet không?', 'Tìm dòng default trong ip route.', 'Đối chiếu ip -4 addr với ip route; hỏi gateway được cấp trước khi sửa profile.'],
    probeNotes: [
      { purpose: 'Xem địa chỉ IPv4 trên interface guest.', meaning: 'Guest có IP 10.10.20.25/24 trong subnet mô phỏng.', commandId: 'ip-addr', aliases: [] },
      { purpose: 'Xem route IPv4 hiện có.', meaning: 'Chỉ thấy route subnet; không thấy default route.', commandId: 'ip-route', aliases: [] },
    ],
    extras: [
      { command: 'ip route get 1.1.1.1', output: 'RTNETLINK answers: Network is unreachable', purpose: 'Hỏi kernel route tới IP ngoài subnet.', meaning: 'Kernel không có route phù hợp tới đích này.', commandId: 'ip-route-get', aliases: [] },
      { command: 'ip -br link show dev enp0s3', output: 'enp0s3 UP', purpose: 'Xem link interface.', meaning: 'Interface đang UP; vẫn cần route để đi ngoài subnet.', commandId: 'ip-link', aliases: [] },
    ],
    verificationPrompt: 'Ghi IP/subnet, route còn thiếu, bước xác nhận gateway và cách kiểm tra kết nối ngoài sau xử lý.',
    questions: [
      q('triage', 'triage', 'single_choice', 'Phạm vi lỗi khách báo là gì?', [['all', 'Mọi kết nối đều lỗi', 'Khách vẫn tới được cùng subnet.'], ['outside', 'Tới subnet nội bộ nhưng không tới IP công cộng', 'Đúng với lời khách.'], ['ssh', 'Chỉ SSH lỗi xác thực', 'Ticket không giới hạn ở SSH.']], ['outside'], 'Xác định phạm vi trước khi chọn lớp cần kiểm tra.'),
      q('check', 'investigate', 'command_choice', 'Lệnh nào trực tiếp kiểm tra đường ra ngoài subnet?', [['route', 'ip route', 'Đúng: xem bảng route, đặc biệt default.'], ['memory', 'free -h', 'RAM không cho biết đường ra mạng.'], ['service', 'systemctl status sshd', 'SSH không giải thích mọi IP công cộng đều không tới.']], ['route'], 'Kiểm tra route bằng phép đọc.', 'ip-route'),
      q('output', 'interpret', 'output_interpretation', 'ip route chỉ có “10.10.20.0/24 dev enp0s3”; thiếu gì?', [['default', 'Default route', 'Đúng: chưa có đường mặc định tới mạng khác.'], ['address', 'Địa chỉ IPv4 của guest', 'ip -4 addr cho thấy guest có IP.'], ['dns', 'A record DNS', 'Kết nối IP công cộng không phụ thuộc A record.']], ['default'], 'Route tới cùng subnet không thay thế default route.', 'ip-route', ['P2']),
      q('evidence', 'interpret', 'multi_select', 'Chọn nhận định được fixture hỗ trợ.', [['ip', 'Guest có IP trong subnet', 'Đúng từ P1.'], ['route', 'Không có default route trong bảng hiện tại', 'Đúng từ P2.'], ['gateway', 'Đã biết gateway chính xác cần cấu hình', 'Fixture chưa cung cấp gateway được cấp.'], ['upstream', 'Upstream chắc chắn hỏng', 'Không thể kết luận upstream khi guest thiếu route.']], ['ip', 'route'], 'Cần xác nhận gateway trước mọi thay đổi.', 'ip-route', ['P1', 'P2']),
      q('decision', 'decide', 'single_choice', 'Lựa chọn tiếp theo phù hợp nhất?', [['confirm', 'Xác nhận gateway/profile qua console rồi đề xuất khôi phục route có phép', 'Đúng: vừa xác minh dữ liệu cấp phát vừa giữ đường quản trị.'], ['guess', 'Đoán gateway và đổi mạng từ phiên SSH', 'Có thể mất đường quản trị; không được đoán.'], ['dns', 'Chỉ đổi DNS resolver', 'DNS không giải quyết thiếu route tới IP công cộng.']], ['confirm'], 'Thay đổi mạng cần console và phương án rollback.', 'nmcli-show'),
      q('sequence', 'decide', 'step_order', 'Sắp xếp các bước kiểm tra và xử lý mạng.', [['ip', 'Ghi nhận IP và subnet', 'Đầu tiên biết guest đang có địa chỉ gì.'], ['route', 'Đọc route hiện tại và route tới IP đích', 'Kiểm tra đường đi trước khi sửa.'], ['gateway', 'Xác nhận gateway/profile được cấp qua console', 'Không đoán gateway.'], ['verify', 'Sau thay đổi có phép, thử IP ngoài và dịch vụ cần dùng', 'Xác minh từ guest và client.']], ['ip', 'route', 'gateway', 'verify'], 'Giữ đường console và rollback trước khi sửa network.', 'ip-route', ['P1', 'P2']),
    ],
  },
  {
    id: 'VPS-03-001',
    objective: 'Phân biệt trạng thái VPS với web service, kiểm tra Nginx và cổng HTTP trước khi đề xuất start.',
    hints: ['Panel báo VM running có chứng minh web service đang chạy không?', 'Kiểm tra systemctl status nginx và listener :80.', 'Sau đó xem log, kiểm tra config và xác minh HTTP từ localhost rồi bên ngoài.'],
    probeNotes: [
      { purpose: 'Xem Nginx service hiện chạy hay không.', meaning: 'inactive (dead) cho biết Nginx đang dừng.', commandId: 'systemctl-nginx', aliases: ['sudo systemctl status nginx'] },
      { purpose: 'Xem cổng TCP đang lắng nghe.', meaning: 'Không có listener :80 theo fixture.', commandId: 'ss-ltnp', aliases: [] },
    ],
    extras: [
      { command: 'journalctl -u nginx -n 50 --no-pager', output: '-- No entries --', purpose: 'Tìm log Nginx gần đây.', meaning: 'Fixture không có log giải thích nguyên nhân dừng.', commandId: 'journalctl-nginx', aliases: ['sudo journalctl -u nginx -n 50 --no-pager'] },
      { command: 'nginx -t', output: 'nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful', purpose: 'Kiểm tra cú pháp Nginx.', meaning: 'Cú pháp hợp lệ không chứng minh service đã chạy hay site đáp ứng.', commandId: 'nginx-test', aliases: ['sudo nginx -t'] },
    ],
    verificationPrompt: 'Ghi trạng thái VM và service riêng biệt, bằng chứng :80, bước xử lý có phép và kiểm tra HTTP sau đó.',
    questions: [
      q('triage', 'triage', 'single_choice', 'Thông tin “VPS running” từ panel cho biết gì?', [['vm', 'Guest/VM được panel báo đang chạy', 'Đúng: chưa nói web service hoạt động.'], ['nginx', 'Nginx chắc chắn đang chạy', 'Panel VM state không kiểm tra service.'], ['http', 'HTTP bên ngoài chắc chắn truy cập được', 'Chưa có kiểm tra HTTP.']], ['vm'], 'Phân biệt VM state và application state.'),
      q('check', 'investigate', 'command_choice', 'Kiểm tra trực tiếp web service bằng lệnh nào?', [['nginx', 'systemctl status nginx', 'Đúng: phép đọc trạng thái Nginx.'], ['route', 'ip route', 'Route không kiểm tra Nginx.'], ['disk', 'df -i /', 'Inode không trực tiếp trả lời service chạy hay dừng.']], ['nginx'], 'Bắt đầu từ service liên quan.', 'systemctl-nginx'),
      q('output', 'interpret', 'output_interpretation', '“Active: inactive (dead)” ở Nginx nghĩa là gì?', [['stopped', 'Nginx đang dừng', 'Đúng theo P1.'], ['why', 'Đã biết lý do Nginx dừng', 'Cần log và ngữ cảnh để tìm nguyên nhân.'], ['off', 'Cả VPS đã tắt', 'Panel vẫn báo VM running.']], ['stopped'], 'Trạng thái không thay cho phân tích nguyên nhân.', 'systemctl-nginx', ['P1']),
      q('evidence', 'interpret', 'multi_select', 'Bằng chứng nào có trong hai output?', [['stopped', 'Nginx inactive', 'Đúng từ P1.'], ['port', 'Không có listener :80', 'Đúng từ P2.'], ['badconfig', 'Nginx config chắc chắn sai', 'Fixture không chứng minh điều này.'], ['hostoff', 'Host vật lý tắt', 'Không có bằng chứng.']], ['stopped', 'port'], 'Chỉ chọn điều thật sự quan sát.', 'ss-ltnp', ['P1', 'P2']),
      q('decision', 'decide', 'single_choice', 'Bước nào giữ an toàn vận hành?', [['logs', 'Xem log/config, xác nhận quyền trước khi start; kiểm tra local và external HTTP', 'Đúng: có điều tra và xác minh.'], ['start', 'Start ngay rồi đóng ticket', 'Thiếu điều tra nguyên nhân và xác minh.'], ['reboot', 'Reboot VPS vì panel running', 'Không có bằng chứng cần reboot.']], ['logs'], 'Mô phỏng không thực hiện start service thật.', 'journalctl-nginx'),
    ],
  },
  {
    id: 'VPS-05-001',
    objective: 'Phân biệt block space với inode và khoanh vùng dữ liệu trước khi đề xuất dọn dẹp.',
    hints: ['Thông báo No space left on device có thể đến từ block hoặc inode.', 'Xem df -h / trước, rồi tìm vùng lớn với du.', 'P1 cho thấy 100% block; P2 cho thấy /var/log lớn, nhưng chưa chỉ ra file được phép xóa.'],
    probeNotes: [
      { purpose: 'Xem block space trên root filesystem.', meaning: 'Root filesystem 100% và còn 0 dung lượng theo fixture.', commandId: 'df-h', aliases: [] },
      { purpose: 'Khoanh vùng thư mục lớn trong /var.', meaning: '/var/log dùng 13G; cần tiếp tục kiểm tra nguồn tăng trưởng.', commandId: 'du-var', aliases: ['sudo du -xhd1 /var'] },
    ],
    extras: [
      { command: 'df -i /', output: 'IUse% 42%', purpose: 'Kiểm tra inode để phân biệt loại tài nguyên cạn.', meaning: 'Inode chưa đầy; khác với VPS-05-002.', commandId: 'df-i', aliases: [] },
      { command: 'journalctl --disk-usage', output: 'Archived and active journals take up 1.2G in the file system.', purpose: 'Xem mức dùng dung lượng của systemd journal.', meaning: 'Journal chiếm một phần nhưng không thể suy ra tất cả 13G /var/log là journal.', commandId: 'journal-disk-usage', aliases: [] },
    ],
    verificationPrompt: 'Ghi block space, vùng chiếm dung lượng, bước tìm nguồn tăng trưởng và cách xác minh app ghi lại được.',
    questions: [
      q('triage', 'triage', 'single_choice', 'Triệu chứng chính là gì?', [['write', 'Ứng dụng không ghi thêm dữ liệu được', 'Đúng: khách nhận No space left on device.'], ['login', 'SSH bị từ chối', 'Ticket không báo lỗi SSH.'], ['dns', 'DNS NXDOMAIN', 'Không có dấu hiệu DNS.']], ['write'], 'Tóm đúng việc người dùng không làm được.'),
      q('check', 'investigate', 'command_choice', 'Kiểm tra block space của / bằng lệnh nào?', [['df', 'df -h /', 'Đúng: kiểm tra dung lượng filesystem.'], ['memory', 'free -h', 'RAM khác với disk block.'], ['route', 'ip route', 'Route không giải thích lỗi ghi file.']], ['df'], 'Bắt đầu bằng phép đọc tài nguyên liên quan.', 'df-h'),
      q('output', 'interpret', 'output_interpretation', '“/dev/vda1 20G 20G 0 100% /” cho thấy gì?', [['full', 'Root filesystem hết block space', 'Đúng: Available = 0 và Use% = 100%.'], ['inode', 'Inode chắc chắn hết', 'Cần df -i để kiểm tra inode.'], ['ram', 'RAM đã đầy', 'Đây là output filesystem, không phải RAM.']], ['full'], 'df -h đo block space; df -i đo inode.', 'df-h', ['P1']),
      q('evidence', 'interpret', 'multi_select', 'Chọn điều có bằng chứng trong fixture.', [['full', '/ đang 100% block', 'Đúng từ P1.'], ['logs', '/var/log chiếm 13G', 'Đúng từ P2.'], ['delete', 'Mọi log đều có thể xóa ngay', 'Dung lượng lớn không phải quyền xóa.'], ['inode', 'Inode / đang 100%', 'P1/P2 không đo inode; cần df -i để đánh giá.']], ['full', 'logs'], 'Quan sát dung lượng không đồng nghĩa được phép xóa.', 'du-var', ['P1', 'P2']),
      q('decision', 'decide', 'single_choice', 'Đề xuất nào an toàn nhất?', [['review', 'Tìm nguồn log tăng trưởng, xác nhận backup/quyền rồi dùng rotation hoặc dọn phần được duyệt', 'Đúng: tránh mất bằng chứng và dữ liệu.'], ['delete', 'rm -rf /var/log ngay', 'Có thể mất dữ liệu/bằng chứng; thao tác phá hủy không được mô phỏng.'], ['reboot', 'Chỉ reboot VPS', 'Reboot không giải quyết nguyên nhân đầy disk.']], ['review'], 'Kiểm tra Available và thao tác ghi của app sau xử lý.', 'du-var'),
      q('sequence', 'decide', 'step_order', 'Sắp xếp quy trình xử lý filesystem đầy.', [['measure', 'Đo block và inode của đúng mount', 'Tránh nhầm tài nguyên hoặc mount.'], ['locate', 'Khoanh vùng thư mục và nguồn tăng trưởng', 'Chỉ xem kích thước chưa đủ để xóa.'], ['approve', 'Xác nhận backup, quyền và biện pháp rotation/dọn an toàn', 'Giữ dữ liệu và bằng chứng cần thiết.'], ['verify', 'Đo lại dung lượng và thử thao tác ghi của app', 'Xác minh triệu chứng đã hết.']], ['measure', 'locate', 'approve', 'verify'], 'Kiểm tra → khoanh vùng → hành động được duyệt → xác minh.', 'df-h', ['P1', 'P2']),
    ],
  },
  {
    id: 'VPS-05-002',
    objective: 'Điều tra lỗi tạo file dù còn dung lượng GB bằng hai phép đo filesystem khác nhau.',
    hints: ['df -h đo block, nhưng còn một tài nguyên khác cho mỗi file.', 'So sánh df -h / với df -i /.', 'IUse% 100% cho thấy inode cạn; cần tìm nơi có nhiều file nhỏ.'],
    probeNotes: [
      { purpose: 'Xem block space trên /.', meaning: 'Use% 45%; chưa hết dung lượng GB.', commandId: 'df-h', aliases: [] },
      { purpose: 'Xem inode trên /.', meaning: 'IUse% 100%: filesystem không còn inode để tạo file mới.', commandId: 'df-i', aliases: [] },
    ],
    extras: [
      { command: 'find /var -xdev -type f | wc -l', output: '850000', purpose: 'Ước lượng số file dưới /var.', meaning: 'Có nhiều file; cần thu hẹp thư mục và xác nhận loại file trước khi dọn.', commandId: 'find-files', aliases: [] },
      { command: 'du -xhd1 /var', output: '1.1G /var', purpose: 'So sánh dung lượng /var với số lượng file.', meaning: 'Không lớn theo GB nhưng có thể chứa rất nhiều file nhỏ.', commandId: 'du-var', aliases: [] },
    ],
    verificationPrompt: 'Ghi sự khác nhau giữa block và inode, thư mục cần điều tra, cách giải phóng inode có phép và phép thử tạo file.',
    questions: [
      q('triage', 'triage', 'single_choice', 'Điểm khác thường trong lời khách là gì?', [['files', 'Không tạo được file dù còn GB', 'Đúng: cần kiểm tra inode.'], ['ram', 'RAM còn trống', 'Khách không nói về RAM.'], ['ssh', 'SSH không hoạt động', 'Không có triệu chứng SSH.']], ['files'], 'Một filesystem có thể hết inode trước khi hết block.'),
      q('check', 'investigate', 'command_choice', 'Lệnh nào kiểm tra số inode còn dùng được?', [['inode', 'df -i /', 'Đúng: -i chuyển sang inode.'], ['blocks', 'df -h /', 'df -h chỉ đo block space.'], ['route', 'ip route', 'Route không liên quan.']], ['inode'], 'Đừng dừng lại ở df -h khi còn GB.', 'df-i'),
      q('output', 'interpret', 'output_interpretation', '“IUse% 100%” nghĩa là gì?', [['full', 'Inode đã được sử dụng hết', 'Đúng: tạo file mới có thể thất bại.'], ['blocks', 'Disk block đã dùng 100%', 'df -h lại cho thấy 45%.'], ['ram', 'Bộ nhớ RAM đã dùng hết', 'Đây là chỉ số inode.']], ['full'], 'Nhiều file nhỏ có thể làm cạn inode.', 'df-i', ['P2']),
      q('evidence', 'interpret', 'multi_select', 'Chọn hai nhận định đúng theo fixture.', [['gb', 'Block space vẫn còn', 'Đúng từ P1.'], ['inode', 'Inode đã hết', 'Đúng từ P2.'], ['which', 'Đã biết chính xác thư mục cần xóa', 'Chưa biết loại file nào được phép xóa.'], ['hardware', 'Ổ cứng vật lý chắc chắn hỏng', 'Không có bằng chứng phần cứng.']], ['gb', 'inode'], 'Tách quan sát khỏi quyết định dọn dữ liệu.', 'df-i', ['P1', 'P2']),
      q('decision', 'decide', 'single_choice', 'Bước tiếp theo an toàn?', [['locate', 'Tìm thư mục có nhiều file nhỏ, xác nhận dữ liệu tạm và quyền dọn/archiving', 'Đúng: điều tra rồi xin phép trước khi xóa.'], ['delete', 'Xóa ngẫu nhiên file dưới /var', 'Có nguy cơ mất dữ liệu hoặc log.'], ['resize', 'Chỉ tăng GB của disk', 'Tăng block chưa chắc giải quyết inode.']], ['locate'], 'Sau xử lý cần thấy inode available và tạo file thành công.', 'find-files'),
    ],
  },
  {
    id: 'VPS-07-001',
    objective: 'Điều tra HTTP connection refused bằng trạng thái Nginx, listener và phép kiểm tra local.',
    hints: ['Connection refused khác HTTP 403/404.', 'Xem service web và listener :80.', 'Nếu Nginx dừng, xem log/config trước khi đề xuất start; sau đó curl local và bên ngoài.'],
    probeNotes: [
      { purpose: 'Xem Nginx đang chạy không.', meaning: 'inactive (dead): service đang dừng.', commandId: 'systemctl-nginx', aliases: ['sudo systemctl status nginx'] },
      { purpose: 'Xem listener TCP.', meaning: 'Không có listener :80 theo fixture.', commandId: 'ss-ltnp', aliases: [] },
    ],
    extras: [
      { command: 'nginx -t', output: 'nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful', purpose: 'Kiểm tra cú pháp trước khi đề xuất start.', meaning: 'Cú pháp hợp lệ không chứng minh Nginx đã chạy.', commandId: 'nginx-test', aliases: ['sudo nginx -t'] },
      { command: 'curl -I http://127.0.0.1', output: 'curl: (7) Failed to connect to 127.0.0.1 port 80: Connection refused', purpose: 'Kiểm tra HTTP từ chính guest.', meaning: 'Local HTTP cũng từ chối kết nối ở port 80.', commandId: 'curl-head', aliases: [] },
    ],
    verificationPrompt: 'Ghi hiện tượng HTTP, bằng chứng service/listener, điều kiện start và phép kiểm tra local + external sau đó.',
    questions: [
      q('triage', 'triage', 'single_choice', '“Connection refused” ở curl cho thấy gì trước mắt?', [['tcp', 'Không thiết lập được TCP tới port đích', 'Đúng: chưa nhận HTTP status.'], ['403', 'Server trả 403 Forbidden', '403 là HTTP response, không phải connection refused.'], ['dns', 'DNS NXDOMAIN', 'Ticket không mô tả NXDOMAIN.']], ['tcp'], 'Phân biệt kết nối TCP và status HTTP.'),
      q('check', 'investigate', 'command_choice', 'Phép kiểm tra đầu tiên phù hợp trong guest?', [['nginx', 'systemctl status nginx', 'Đúng: xem web service.'], ['inode', 'df -i /', 'Không trực tiếp kiểm tra web service.'], ['dig', 'dig example.com A', 'Không giải thích local curl refused.']], ['nginx'], 'Kiểm tra service trước khi thay đổi.', 'systemctl-nginx'),
      q('output', 'interpret', 'output_interpretation', 'Nginx inactive và không có listener :80 nghĩa là gì?', [['stopped', 'Web service hiện dừng và port HTTP không lắng nghe', 'Đúng với P1/P2.'], ['reason', 'Đã biết chính xác nguyên nhân dừng', 'Vẫn cần log/ngữ cảnh.'], ['disk', 'Ổ đĩa chắc chắn đầy', 'Không có bằng chứng disk.']], ['stopped'], 'Có thể giải thích triệu chứng mà chưa biết nguyên nhân ban đầu.', 'ss-ltnp', ['P1', 'P2']),
      q('evidence', 'interpret', 'multi_select', 'Chọn các quan sát hỗ trợ.', [['inactive', 'Nginx inactive', 'Đúng từ P1.'], ['port', 'Không có listener :80', 'Đúng từ P2.'], ['config', 'Cấu hình chắc chắn sai', 'P1/P2 không xác nhận lỗi cấu hình; cần nginx -t và log.'], ['upstream', 'Upstream ISP chắc chắn lỗi', 'Không có bằng chứng upstream.']], ['inactive', 'port'], 'Chỉ nêu output đã thấy.', 'systemctl-nginx', ['P1', 'P2']),
      q('decision', 'decide', 'single_choice', 'Đề xuất nào hợp lý?', [['safe', 'Xem log/config, start nếu có quyền, rồi curl local và bên ngoài', 'Đúng: xử lý kèm xác minh.'], ['instant', 'Restart Nginx ngay và đóng ticket', 'Không điều tra/kiểm chứng.'], ['reinstall', 'Reinstall VPS', 'Quá rủi ro và không có cơ sở.']], ['safe'], 'Mô phỏng không thực hiện thao tác start thật.', 'curl-head'),
    ],
  },
  {
    id: 'VPS-08-002',
    objective: 'Đối chiếu chính xác hostname khi điều tra NXDOMAIN và giới hạn kết luận theo bằng chứng DNS.',
    customerFollowup: 'Customer follow-up: I copied the exact address from my browser: ww.example.com.',
    hints: ['Nhìn kỹ từng ký tự trong hostname.', 'So sánh ww.example.com và www.example.com.', 'Một tên NXDOMAIN nhưng tên khác trả A record; xác nhận FQDN khách thực sự dùng.'],
    probeNotes: [
      { purpose: 'Tra A record cho hostname khách gõ.', meaning: 'ww.example.com trả NXDOMAIN trong fixture.', commandId: 'dig-a', context: 'client', aliases: [] },
      { purpose: 'Tra A record cho hostname www.', meaning: 'www.example.com trả IP; hai hostname khác nhau.', commandId: 'dig-a', context: 'client', aliases: [] },
    ],
    extras: [
      { command: 'dig example.com A', output: 'status: NOERROR; ANSWER: 198.51.100.20', purpose: 'Kiểm tra apex domain.', meaning: 'Apex có bản ghi; không tự tạo alias ww.', commandId: 'dig-a', context: 'client', aliases: [] },
      { command: 'dig ww.example.com NS', output: 'status: NXDOMAIN', purpose: 'Kiểm tra lại exact hostname ww.', meaning: 'Vẫn không chứng minh toàn bộ DNS zone hỏng.', commandId: 'dig-ns', context: 'client', aliases: [] },
    ],
    verificationPrompt: 'Ghi hostname khách đã dùng, kết quả DNS cho hai tên, bước xác nhận tên đúng và cách xác minh trang tải.',
    questions: [
      q('triage', 'triage', 'single_choice', 'Triệu chứng khách báo thuộc lớp nào?', [['dns', 'Không phân giải được hostname đã nhập', 'Đúng: cần xem exact FQDN.'], ['http', 'HTTP 502', 'Chưa tới HTTP nếu tên không phân giải.'], ['ssh', 'SSH Permission denied', 'Không liên quan.']], ['dns'], 'Ghi đúng tên được hỏi là quan trọng nhất.'),
      q('check', 'investigate', 'command_choice', 'Cần tra chính xác tên khách gõ bằng gì?', [['ww', 'dig ww.example.com A', 'Đúng: giữ nguyên hostname được báo.'], ['www', 'Chỉ dig www.example.com A', 'Tên www khác ww; nên đối chiếu cả hai.'], ['disk', 'df -h /', 'Disk không giải thích NXDOMAIN.']], ['ww'], 'Không tự sửa tên trước khi ghi nhận kết quả.', 'dig-a'),
      q('output', 'interpret', 'output_interpretation', 'ww.example.com NXDOMAIN nhưng www.example.com có A record nghĩa là gì?', [['different', 'Hai hostname khác nhau; tên ww chưa có record trong fixture', 'Đúng theo P1/P2.'], ['zone', 'Toàn bộ DNS zone hỏng', 'www vẫn trả A record.'], ['http', 'Web server chắc chắn đã dừng', 'DNS output không đo trạng thái web service.']], ['different'], 'Không mở rộng kết luận từ một hostname sang toàn zone.', 'dig-a', ['P1', 'P2']),
      q('evidence', 'interpret', 'multi_select', 'Chọn điều output hỗ trợ.', [['ww', 'ww trả NXDOMAIN', 'Đúng từ P1.'], ['www', 'www trả 198.51.100.20', 'Đúng từ P2.'], ['down', 'Web server đã hỏng', 'Chưa có kiểm tra HTTP.'], ['provider', 'Mọi DNS provider đều lỗi', 'Không được chứng minh.']], ['ww', 'www'], 'Tách kết quả DNS của từng tên.', 'dig-a', ['P1', 'P2']),
      q('decision', 'decide', 'single_choice', 'Bước tiếp theo an toàn?', [['confirm', 'Xác nhận FQDN khách muốn dùng; sửa typo hoặc đề xuất alias nếu chủ sở hữu duyệt', 'Đúng: không tự thay đổi zone.'], ['all', 'Xóa toàn bộ DNS records', 'Phá hủy cấu hình và không có cơ sở.'], ['reboot', 'Reboot VPS', 'NXDOMAIN không giải quyết bằng reboot guest.']], ['confirm'], 'Xác minh đúng FQDN phân giải và trang tải sau thay đổi được phép.', 'dig-a'),
      q('sequence', 'decide', 'step_order', 'Sắp xếp cách xử lý hostname được báo lỗi.', [['exact', 'Ghi lại exact FQDN khách đã nhập', 'Giữ nguyên chuỗi để tránh che lỗi gõ tên.'], ['compare', 'Tra DNS cho tên đó và tên dự kiến', 'Hai hostname cần được so sánh riêng.'], ['confirm', 'Xác nhận tên mong muốn với chủ sở hữu', 'Chưa tự đổi zone.'], ['verify', 'Sau sửa đổi được duyệt, kiểm tra DNS và HTTP theo tên đúng', 'DNS phân giải không tự chứng minh web hoạt động.']], ['exact', 'compare', 'confirm', 'verify'], 'Không thay đổi DNS trước khi xác nhận ý định của khách.', 'dig-a', ['P1', 'P2']),
    ],
  },
  {
    id: 'VPS-01-003',
    objective: 'Khoanh vùng vì sao xác thực SSH bằng private key không thành công từ client.',
    hints: ['Cảnh báo nhắc đến file nào và quyền octal bao nhiêu?', 'Đối chiếu ssh -i với ls -l của cùng private key trên client.', '0644 cho phép người khác đọc file; kiểm tra quyền key trên client rồi thử SSH lại, không đổi sshd trong guest.'],
    probeNotes: [
      { purpose: 'Thử đăng nhập bằng private key từ client.', meaning: 'Client SSH cảnh báo private key có quyền 0644 quá rộng; chưa có bằng chứng account ở guest sai.', commandId: 'ssh-key-login', context: 'client', aliases: [] },
      { purpose: 'Đọc mode và chủ sở hữu private key trên client.', meaning: '-rw-r--r-- tương ứng 0644: group và others có quyền đọc.', commandId: 'ls-key-mode', context: 'client', aliases: [] },
    ],
    extras: [],
    verificationPrompt: 'Ghi cảnh báo 0644, ý nghĩa của mode, bước chỉnh quyền trên client nếu được phép và cách thử lại SSH.',
    questions: [
      q('triage', 'triage', 'single_choice', 'Điều gì khách đã báo trước khi ta chạy lệnh?', [['key', 'Đăng nhập bằng private key không thành công', 'Đúng với lời khách; lý do cần kiểm tra thêm.'], ['server', 'sshd trong guest đã dừng', 'Chưa có probe kiểm tra service guest.'], ['dns', 'DNS không phân giải', 'Ticket dùng địa chỉ IP, không có bằng chứng DNS.']], ['key'], 'Ghi nhận triệu chứng xác thực trước khi tìm nguyên nhân.'),
      q('check', 'investigate', 'command_choice', 'Lệnh đọc nào xác nhận mode file key trên client?', [['ls', 'ls -l ~/.ssh/lab_key', 'Đúng: liệt kê mode và owner của chính file key.'], ['status', 'systemctl status sshd', 'Service guest không cho biết quyền private key trên client.'], ['route', 'ip route', 'Route không cho biết mode file.']], ['ls'], 'Kiểm tra đối tượng mà cảnh báo nêu.', 'ls-key-mode'),
      q('output', 'interpret', 'output_interpretation', '“-rw-r--r-- lab lab” cho biết gì?', [['open', 'Owner đọc/ghi, group và others còn đọc được', 'Đúng: đó là mode 0644.'], ['safe', 'Chỉ owner đọc được file', 'Group và others còn quyền đọc.'], ['remote', 'Guest có file key quyền 0644', 'Probe chạy ở client; không suy ra file trong guest.']], ['open'], 'Private key cần được bảo vệ ở nơi lưu trên client.', 'ls-key-mode', ['P2']),
      q('evidence', 'interpret', 'multi_select', 'Chọn các nhận định được hai output hỗ trợ.', [['warning', 'SSH client đã cảnh báo quyền key 0644', 'Đúng từ P1.'], ['mode', 'File key hiện có mode -rw-r--r--', 'Đúng từ P2.'], ['password', 'Mật khẩu của user lab chắc chắn sai', 'Chưa có phép thử mật khẩu.'], ['daemon', 'sshd ở guest chắc chắn hỏng', 'Không có output trạng thái guest.']], ['warning', 'mode'], 'Giới hạn kết luận ở client key.', 'ssh-key-login', ['P1', 'P2']),
      q('decision', 'decide', 'single_choice', 'Bước tiếp theo phù hợp nhất?', [['client', 'Nếu có quyền với key của mình, giới hạn quyền đọc trên client rồi thử lại SSH', 'Đúng: sửa nơi có vấn đề và xác minh, không chạm guest.'], ['guest', 'Restart sshd trong guest ngay', 'Không có bằng chứng cần restart và đó là thay đổi service.'], ['share', 'Gửi private key cho support để kiểm tra', 'Không chia sẻ secret; có thể kiểm tra mode mà không gửi key.']], ['client'], 'Sau khi bảo vệ key, nếu vẫn lỗi thì mới điều tra xác thực phía guest.', 'ssh-key-login'),
    ],
  },
  {
    id: 'VPS-03-003',
    objective: 'Điều tra service dừng sau khi chỉnh config bằng trạng thái và phép kiểm tra cú pháp.',
    hints: ['Service failed là trạng thái; tìm phép đọc giải thích vì sao không nạp cấu hình.', 'Chạy nginx -t rồi chú ý file, dòng và token trong thông báo.', 'P2 nêu dấu ngoặc } bất ngờ ở dòng 45; đối chiếu diff/backup trước khi sửa và kiểm tra lại -t.'],
    probeNotes: [
      { purpose: 'Xem trạng thái Nginx sau khi khách sửa config.', meaning: 'Nginx đang failed, nhưng status rút gọn chưa nêu nguyên nhân.', commandId: 'systemctl-nginx', aliases: [] },
      { purpose: 'Kiểm tra cú pháp cấu hình Nginx mà không restart.', meaning: 'Bộ kiểm tra cú pháp báo dấu } bất ngờ trong nginx.conf dòng 45.', commandId: 'nginx-test', aliases: ['sudo nginx -t'] },
    ],
    extras: [],
    verificationPrompt: 'Ghi status failed, vị trí lỗi cấu hình, bước đối chiếu/duyệt sửa và xác minh syntax cùng HTTP sau đó.',
    questions: [
      q('triage', 'triage', 'single_choice', 'Lời khách cho biết mốc thay đổi nào?', [['config', 'Service dừng sau khi chỉnh config', 'Đúng: đây là mốc cần đối chiếu, chưa đủ làm bằng chứng lỗi cú pháp.'], ['host', 'VPS đã tắt nguồn', 'Khách nói service dừng, chưa nói VM tắt.'], ['dns', 'DNS bị đổi', 'Ticket không nhắc DNS.']], ['config'], 'Thời điểm thay đổi giúp chọn phép kiểm tra.'),
      q('check', 'investigate', 'command_choice', 'Sau status, phép đọc nào kiểm tra cú pháp Nginx?', [['test', 'nginx -t', 'Đúng: kiểm tra config mà không restart service.'], ['restart', 'systemctl restart nginx', 'Restart thay đổi trạng thái khi chưa biết lỗi.'], ['disk', 'df -h /', 'Disk có thể cần điều tra trong case khác, nhưng chưa trực tiếp với chỉnh config.']], ['test'], 'Kiểm tra cú pháp trước khi đề xuất reload/start.', 'nginx-test'),
      q('output', 'interpret', 'output_interpretation', 'Thông báo “unexpected } ... nginx.conf:45” hỗ trợ kết luận nào?', [['syntax', 'Config có lỗi cú pháp liên quan dấu } tại dòng 45', 'Đúng: nginx -t xác định file/dòng/token.'], ['healthy', 'Config hợp lệ nhưng mạng hỏng', 'P2 báo lỗi cú pháp.'], ['all', 'Mọi file trên VPS bị hỏng', 'Output chỉ nói về config Nginx.']], ['syntax'], 'Đối chiếu dòng và diff để sửa đúng chỗ; không đoán toàn bộ hệ thống.', 'nginx-test', ['P2']),
      q('evidence', 'interpret', 'multi_select', 'Hai output chứng minh những gì?', [['failed', 'Nginx hiện failed', 'Đúng từ P1.'], ['line', 'nginx -t báo lỗi ở nginx.conf:45', 'Đúng từ P2.'], ['cause', 'Đã xác định ai chỉnh file', 'Không có audit về người chỉnh.'], ['fixed', 'HTTP đã hồi phục', 'Chưa có sửa hoặc thử HTTP.']], ['failed', 'line'], 'Trạng thái và lỗi cú pháp là hai bằng chứng khác nhau.', 'systemctl-nginx', ['P1', 'P2']),
      q('decision', 'decide', 'single_choice', 'Quy trình xử lý an toàn?', [['review', 'Đối chiếu diff/backup, sửa có quyền, chạy nginx -t rồi mới start/reload và thử HTTP', 'Đúng: kiểm tra cấu hình và tác động trước khi đổi service.'], ['delete', 'Xóa nginx.conf để service tự tạo lại', 'Có nguy cơ mất cấu hình và không có cơ sở.'], ['restart', 'Restart lặp lại cho tới khi service chạy', 'Lỗi cú pháp chưa được giải quyết.']], ['review'], 'Fixture không mô phỏng việc sửa file hay service.', 'nginx-test'),
    ],
  },
  {
    id: 'VPS-05-004',
    objective: 'Điều tra lỗi ghi vào /data bằng mount options và thông báo kernel, rồi chọn bước an toàn.',
    hints: ['Đọc option ro/rw của đúng mount /data.', 'Kết hợp findmnt với thông báo kernel về device vdb.', 'Mount ro và Buffer I/O error là dấu hiệu cần bảo vệ dữ liệu; chưa tự kết luận ổ vật lý nào hỏng.'],
    probeNotes: [
      { purpose: 'Xem nguồn và mount option của /data.', meaning: '/data dùng /dev/vdb1 và hiện có option ro (read-only).', commandId: 'findmnt', aliases: [] },
      { purpose: 'Đọc thông báo kernel gần đây về storage.', meaning: 'Có Buffer I/O error trên dev vdb; cần đối chiếu thời điểm và tình trạng storage/provider.', commandId: 'dmesg-tail', aliases: [] },
    ],
    extras: [],
    verificationPrompt: 'Ghi mount ro, lỗi I/O, cách giữ dữ liệu và chuyển cấp; nêu điều kiện xác minh sau sửa chữa được duyệt.',
    questions: [
      q('triage', 'triage', 'single_choice', 'Triệu chứng người dùng báo là gì?', [['write', 'Không ghi được dữ liệu vì filesystem báo read-only', 'Đúng với lời khách.'], ['memory', 'RAM đầy', 'Không có thông tin RAM.'], ['dns', 'Không phân giải tên miền', 'Không liên quan.']], ['write'], 'Bắt đầu từ thao tác thất bại, chưa đoán nguyên nhân.'),
      q('check', 'investigate', 'command_choice', 'Lệnh nào đọc mount option của đúng /data?', [['mount', 'findmnt -no SOURCE,OPTIONS /data', 'Đúng: xem nguồn và tùy chọn mount.'], ['free', 'free -h', 'RAM không cho biết /data là ro hay rw.'], ['restart', 'reboot', 'Reboot thay đổi trạng thái và có rủi ro dữ liệu.']], ['mount'], 'Kiểm tra mount trước khi đề xuất sửa.', 'findmnt'),
      q('output', 'interpret', 'output_interpretation', '“/dev/vdb1 ro,relatime” cho biết điều gì?', [['ro', '/data hiện được mount read-only từ /dev/vdb1', 'Đúng theo P1.'], ['safe', 'Dữ liệu trên volume chắc chắn nguyên vẹn', 'Option ro không chứng minh integrity.'], ['block', 'Root filesystem / chắc chắn đầy', 'Output nói về /data, không đo dung lượng /.']], ['ro'], 'Đọc đúng mount và option của nó.', 'findmnt', ['P1']),
      q('evidence', 'interpret', 'multi_select', 'Hai output hỗ trợ những nhận định nào?', [['ro', '/data có option ro', 'Đúng từ P1.'], ['io', 'Kernel ghi nhận Buffer I/O error trên vdb', 'Đúng từ P2.'], ['drive', 'Đã xác định ổ vật lý cụ thể bị hỏng', 'Chưa có dữ liệu host/provider để kết luận phần cứng.'], ['repair', 'Có thể remount rw ngay mà không kiểm tra', 'Lỗi I/O đòi hỏi bảo vệ dữ liệu và điều tra.']], ['ro', 'io'], 'Có dấu hiệu rủi ro storage nhưng phạm vi và nguồn gốc cần xác minh.', 'dmesg-tail', ['P1', 'P2']),
      q('decision', 'decide', 'single_choice', 'Bước xử lý an toàn nhất?', [['escalate', 'Ngừng thao tác ghi, kiểm tra backup/sức khỏe storage và chuyển đội hạ tầng để sửa có kiểm soát', 'Đúng: ưu tiên integrity dữ liệu.'], ['remount', 'Remount rw và tiếp tục ghi ngay', 'Có thể làm hỏng thêm dữ liệu khi I/O đang lỗi.'], ['delete', 'Xóa log để hết read-only', 'Không giải quyết lỗi I/O và làm mất bằng chứng.']], ['escalate'], 'Xác minh dữ liệu và mount sau xử lý được phê duyệt; không mô phỏng sửa thật.', 'dmesg-tail'),
    ],
  },
  {
    id: 'VPS-08-003',
    objective: 'Điều tra vì sao thay đổi DNS trong panel chưa xuất hiện với người dùng.',
    hints: ['Thay đổi ở panel nào? Resolver đang báo nameserver nào?', 'So sánh P1 về NS và P2 về zone được chỉnh.', 'Hai nguồn đang khác nhau; kiểm tra delegation ở registrar và trả lời trực tiếp từ authoritative NS trước khi kết luận.'],
    probeNotes: [
      { purpose: 'Tra NS của example.test từ điểm truy vấn hiện tại.', meaning: 'Truy vấn hiện trả old-dns; một kết quả resolver chưa tự chứng minh trạng thái registrar hiện tại.', commandId: 'dig-ns', context: 'client', aliases: [] },
      { purpose: 'Xem tên nameserver của zone vừa chỉnh trong panel mô phỏng.', meaning: 'Panel ghi new-dns; đây là nơi được chỉnh, chưa chứng minh domain đã ủy quyền tới đó.', commandId: 'panel-zone', context: 'panel', aliases: [] },
    ],
    extras: [],
    verificationPrompt: 'Ghi NS thấy từ truy vấn và panel, điều chưa biết về registrar, bước xác nhận ủy quyền và kiểm tra authoritative A record.',
    questions: [
      q('triage', 'triage', 'single_choice', 'Khách báo hiện tượng nào sau khi sửa DNS?', [['old', 'Người dùng chưa thấy IP mới', 'Đúng: cần kiểm tra nơi có thẩm quyền và cache.'], ['ssh', 'SSH Permission denied', 'Ticket không nói SSH.'], ['disk', 'Filesystem hết chỗ', 'Không có triệu chứng disk.']], ['old'], 'Ghi hiện tượng trước khi gán nguyên nhân propagation.'),
      q('check', 'investigate', 'command_choice', 'Cần đọc thông tin NS hiện trả về bằng gì?', [['dig', 'dig example.test NS', 'Đúng: xem bản ghi NS theo nguồn truy vấn này.'], ['curl', 'curl -I http://localhost', 'HTTP localhost không cho biết delegation.'], ['route', 'ip route', 'Route guest không cho biết NS domain.']], ['dig'], 'Sau đó cần kiểm tra registrar và authoritative NS trực tiếp.', 'dig-ns'),
      q('output', 'interpret', 'output_interpretation', 'P1 trả old-dns, còn panel P2 ghi new-dns. Kết luận nào vừa đủ?', [['different', 'Hai nguồn hiện không khớp; phải kiểm tra delegation và authoritative answer', 'Đúng: chưa đủ chứng minh registrar hiện trỏ đâu.'], ['changed', 'Registrar chắc chắn đã đổi sang new-dns', 'Panel zone không phải bằng chứng delegation ở registrar.'], ['broken', 'Mọi DNS resolver đều bị hỏng', 'Chỉ có một điểm truy vấn trong fixture.']], ['different'], 'Phân biệt zone được sửa với nameserver được domain dùng.', 'dig-ns', ['P1', 'P2']),
      q('evidence', 'interpret', 'multi_select', 'Chọn điều hai fixture thực sự cho biết.', [['old', 'Truy vấn NS hiện trả old-dns', 'Đúng từ P1.'], ['new', 'Panel mô phỏng ghi zone new-dns đã được chỉnh', 'Đúng từ P2.'], ['registrar', 'Registrar đã xác nhận delegation tới old-dns', 'Chưa có dữ liệu registrar.'], ['a', 'A record ở old-dns và new-dns giống nhau', 'Chưa hỏi authoritative A record.']], ['old', 'new'], 'Hai quan sát khác nhau; cần thêm phép kiểm tra trước khi sửa.', 'panel-zone', ['P1', 'P2']),
      q('decision', 'decide', 'single_choice', 'Bước tiếp theo an toàn nhất?', [['verify', 'Xác nhận NS ở registrar và hỏi trực tiếp authoritative NS; đổi delegation chỉ khi chủ domain duyệt', 'Đúng: tránh sửa sai zone hoặc đổi ủy quyền khi chưa có quyền.'], ['delete', 'Xóa zone cũ ngay', 'Có thể làm gián đoạn domain khi chưa rõ delegation.'], ['wait', 'Chỉ chờ propagation mà không kiểm tra gì', 'Có thể chờ nhầm khi zone được sửa không có thẩm quyền.']], ['verify'], 'Sau thay đổi được phép, kiểm tra delegation và A record từ nhiều điểm.', 'dig-ns'),
    ],
  },
]

// Batch 2 uses the immutable P1/P2 source commands and outputs, while every
// interpretation, decision, distractor and extra fixture below is reviewed by case.
const sourceTickets = new Map(JSON.parse(readFileSync(new URL('../starter-data/tickets.json', import.meta.url), 'utf8')).tickets.map(ticket => [ticket.id, ticket]))
const guidedBatch2 = []
function addBatchCase(meta) {
  const ticket = sourceTickets.get(meta.id)
  if (!ticket) throw new Error(`Missing source ticket ${meta.id}`)
  const [p1, p2] = ticket.probe_outputs
  const ask = (id, stage, kind, prompt, options, correctIds, explanation, commandId, requiredProbeIds) => ({ ...q(id, stage, kind, prompt, options, correctIds, explanation, commandId, requiredProbeIds), skill: meta.skill })
  const extraIds = meta.extras?.map((_, index) => `G${index + 1}`) ?? []
  const advanced = ticket.difficulty >= 2
  guidedBatch2.push({
    id: meta.id, objective: meta.objective,
    ...((meta.probeOverrides || meta.p1Override !== undefined || meta.p2Override !== undefined) ? { probeOverrides: { ...(meta.probeOverrides ?? {}), ...(meta.p1Override !== undefined ? { P1: meta.p1Override } : {}), ...(meta.p2Override !== undefined ? { P2: meta.p2Override } : {}) } } : {}),
    hints: [
      `Hãy mô tả triệu chứng khách báo trước khi suy luận: ${meta.symptom}`,
      `Đọc P1 (${p1.command}) và P2 (${p2.command}); ghi điều mỗi output thật sự chứng minh.`,
      `Sau khi đã có bằng chứng, cân nhắc quyền thao tác và xác minh: ${meta.verify}`,
    ],
    probeNotes: [
      { purpose: meta.p1.purpose, meaning: meta.p1.meaning, commandId: meta.p1.doc, aliases: [], context: meta.p1.context ?? 'guest' },
      { purpose: meta.p2.purpose, meaning: meta.p2.meaning, commandId: meta.p2.doc, aliases: [], context: meta.p2.context ?? 'guest' },
    ],
    extras: meta.extras ?? [],
    verificationPrompt: `Ghi triệu chứng, P1/P2 và dữ liệu bổ sung đã thấy; nêu điều chưa chắc chắn, hướng xử lý/escalation và cách xác minh: ${meta.verify}`,
    questions: [
      ask('triage', 'triage', 'single_choice', 'Triệu chứng nào cần được xác nhận trước khi chọn hướng xử lý?', [
        ['symptom', meta.symptom, 'Đúng: mô tả điều khách quan sát, chưa khẳng định nguyên nhân.'],
        ['other', meta.redHerring, 'Điều này không được khách báo hoặc không phù hợp phạm vi hiện tại.'],
        ['cause', 'Đã xác định chính xác root cause chỉ từ lời khách.', 'Lời khách mô tả hiện tượng, chưa đủ xác định nguyên nhân.'],
      ], ['symptom'], 'Tách lời khách hàng khỏi giả thuyết kỹ thuật.'),
      ask('check', 'investigate', 'command_choice', `Phép kiểm tra nào trực tiếp đọc ${meta.p1.purpose.toLowerCase()}?`, [
        ['direct', p1.command, 'Đúng: đây là phép đọc fixture P1 tại đúng ngữ cảnh.'],
        ['wrong1', meta.wrongChecks[0], 'Lệnh này không đo dấu hiệu cần xác nhận trong câu hỏi.'],
        ['wrong2', meta.wrongChecks[1], 'Phép này có thể hữu ích ở tình huống khác, nhưng không trả lời câu hỏi này.'],
      ], ['direct'], 'Đọc output tại đúng ngữ cảnh trước khi khẳng định nguyên nhân.', meta.p1.doc),
      ask('output', 'interpret', 'output_interpretation', meta.outputPrompt ?? `Sau khi đọc P1/P2${extraIds.length ? ' và phép kiểm tra bổ sung' : ''}, cách hiểu nào đủ bằng chứng?`, [
        ['supported', meta.finding, 'Đúng: cách diễn giải bám các output đã quan sát.'],
        ['over', meta.overclaim, 'Kết luận này đòi thêm bằng chứng hoặc vượt phạm vi output.'],
        ['ignore', 'Các output không có giá trị điều tra nào.', 'Các output có thông tin hữu ích; cần đọc đúng giới hạn.'],
      ], ['supported'], `Phân biệt bằng chứng với giả thuyết: ${meta.finding}`, meta.p2.doc, advanced ? ['P1', 'P2', ...extraIds] : ['P1', 'P2']),
      ask('evidence', 'interpret', 'multi_select', 'Chọn đúng hai quan sát có trong fixture; bỏ nhận định suy diễn.', [
        ['p1', meta.p1.meaning, 'Đúng theo P1 trong bài này.'],
        ['p2', meta.p2.meaning, 'Đúng theo P2 trong bài này.'],
        ['over', meta.overclaim, 'Chưa được P1/P2 chứng minh.'],
      ], ['p1', 'p2'], 'Hai quan sát đúng không tự động chứng minh mọi mắt xích trong root cause.', meta.p2.doc, ['P1', 'P2']),
      ask('decision', 'decide', 'single_choice', meta.decisionPrompt ?? 'Quyết định tiếp theo nào đúng phạm vi và an toàn nhất?', [
        ['safe', meta.safeNext, 'Đúng: dùng bằng chứng, quyền và phạm vi thay đổi phù hợp.'],
        ['unsafe', meta.unsafe, 'Thiếu bằng chứng, quyền hoặc bảo vệ dịch vụ/dữ liệu.'],
        ['close', 'Đóng ticket ngay mà không kiểm tra sau xử lý.', 'Một chẩn đoán hợp lý chưa thay thế xác minh sau hành động.'],
      ], ['safe'], `Bước tiếp theo: ${meta.safeNext} Xác minh: ${meta.verify}`),
      ...(advanced ? [ask('order', 'verify', 'step_order', 'Sắp xếp quy trình điều tra và xử lý để tránh kết luận sớm.', [
        ['evidence', 'Đối chiếu P1, P2 và probe bổ sung; ghi điều còn chưa biết.', 'Đúng ở đầu: thu thập và giới hạn kết luận.'],
        ['verify', meta.verify, 'Đúng ở cuối: đo lại triệu chứng sau xử lý hoặc escalation.'],
        ['act', meta.safeNext, 'Đúng sau khi bằng chứng và quyền đã được xác nhận.'],
      ], ['evidence', 'act', 'verify'], 'Điều tra → quyết định có kiểm soát → xác minh; escalation cũng là một quyết định hợp lệ.')] : []),
    ],
  })
}

addBatchCase({
  id: 'VPS-01-004', skill: 'ssh-firewall', objective: 'Phân biệt daemon đang chạy với đường TCP từ client bị chặn; kiểm tra đúng firewalld zone.',
  p1: { doc: 'systemctl-status', purpose: 'trạng thái SSH daemon', meaning: 'sshd trả active tại thời điểm đọc; chưa chứng minh client tới TCP/22.' },
  p2: { doc: 'firewall-list', purpose: 'dịch vụ và port trong firewalld zone', meaning: 'Output zone được hỏi không liệt kê ssh hay TCP/22; cần xác nhận zone đang áp dụng.' },
  symptom: 'Ping được VPS nhưng SSH từ client bị timeout.', redHerring: 'SSH báo Permission denied sau khi nhập mật khẩu.',
  finding: 'sshd active, nhưng rule của zone được hỏi chưa cho thấy SSH; phải xác nhận active zone và thử TCP từ client.',
  overclaim: 'Đã chứng minh mọi lớp mạng khác đều cho TCP/22 đi qua.', safeNext: 'Xác nhận active zone, listener và phép thử TCP từ client; chỉ mở SSH theo policy khi được duyệt.',
  unsafe: 'Mở tất cả port của firewall để thử.', verify: 'TCP/22 và đăng nhập từ client được phép, rule còn hiệu lực sau reload.',
  wrongChecks: ['df -h /', 'dig example.com A'],
})
addBatchCase({
  id: 'VPS-01-005', skill: 'ssh-host-key', objective: 'Xử lý cảnh báo host key bằng kênh tin cậy sau reinstall, không bỏ qua xác thực host.',
  p1: { doc: 'ssh-vvv', purpose: 'cảnh báo host key từ client', meaning: 'Client từ chối host key hiện nhận được; chưa chứng minh đây là key hợp lệ.' , context: 'client' },
  p2: { doc: 'panel-rebuild', purpose: 'lịch sử rebuild trong panel', meaning: 'Panel ghi nhận reinstall 15 phút trước; đây là bối cảnh, không xác thực fingerprint mới.', context: 'panel' },
  symptom: 'SSH từ client dừng ở cảnh báo host key changed sau reinstall.', redHerring: 'VPS hết dung lượng và không ghi được file.',
  finding: 'Reinstall có thể giải thích key đổi, nhưng phải đối chiếu fingerprint qua console đáng tin cậy.',
  overclaim: 'Reinstall tự động chứng minh host key mới an toàn để chấp nhận.', safeNext: 'Lấy fingerprint host key qua console tin cậy, so với client rồi mới thay known_hosts entry nếu khớp.',
  unsafe: 'Tắt StrictHostKeyChecking và chấp nhận mọi key mới.', verify: 'Fingerprint khớp qua kênh tin cậy và SSH đăng nhập tới đúng host.',
  wrongChecks: ['df -h /', 'systemctl status nginx'],
  extras: [{ command: 'ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub', output: '256 SHA256:p5H2S8FvJ3eBNnQmK9wR42Yz0cLaT6dXrM1qV7uE8A0 root@reinstalled-vm (ED25519)', purpose: 'Đọc fingerprint từ guest console tin cậy.', meaning: 'Có fingerprint để so với client; một giá trị riêng lẻ chưa xác nhận hai đầu khớp.', commandId: 'ssh-host-fingerprint', aliases: [], context: 'guest' }],
})
addBatchCase({
  id: 'VPS-01-006', skill: 'ssh-source-ban', objective: 'Xác nhận source IP bị chặn có đúng là của khách trước khi cân nhắc unban.',
  p1: { doc: 'fail2ban-status', purpose: 'danh sách IP bị ban của jail sshd', meaning: '198.51.100.14 xuất hiện trong ban list; chưa xác minh đó là IP hiện tại của khách.' },
  p2: { doc: 'fail2ban-log', purpose: 'log ban gần đây của Fail2ban', meaning: 'Log ghi hành động ban 198.51.100.14; cần xem sự kiện đăng nhập dẫn tới ban.' },
  symptom: 'Chỉ mạng văn phòng của khách timeout khi SSH; mạng khác còn vào được.', redHerring: 'Tất cả client đều nhận Permission denied.',
  finding: 'IP trong jail bị ban; cần đối chiếu IP nguồn và auth failures trước khi kết luận đây là nguyên nhân của khách.',
  overclaim: 'Mọi attempt từ 198.51.100.14 đều là hợp lệ.', safeNext: 'Xác minh IP nguồn, quyền sở hữu và auth log; unban theo policy nếu phù hợp, đồng thời xử lý nguyên nhân ban.',
  unsafe: 'Tắt Fail2ban toàn bộ để thử SSH.', verify: 'SSH từ IP được phép hoạt động và không bị ban lại bất thường.',
  wrongChecks: ['df -h /', 'dig example.com NS'],
  extras: [{ command: 'journalctl -u sshd -n 20 --no-pager', output: 'Failed password for invalid user admin from 198.51.100.14 port 50221 ssh2', purpose: 'Đối chiếu lý do ban với auth log.', meaning: 'Có failed login từ IP này; chưa chứng minh người dùng hợp lệ hay attacker.', commandId: 'journalctl-unit', aliases: [] }],
})
addBatchCase({
  id: 'VPS-01-007', skill: 'ssh-custom-port', objective: 'Phân biệt port SSH thực đang nghe với port client mặc định và kiểm tra policy mạng.',
  p1: { doc: 'ss-ltnp', purpose: 'listener TCP của guest', meaning: 'Output chỉ cho thấy listener ở TCP/2222; không thấy TCP/22 trong snapshot.' },
  p2: { doc: 'sshd-effective', purpose: 'dòng Port trong sshd_config', meaning: 'File cấu hình có Port 2222; chưa chứng minh config nạp thành công hay port được phép từ client.' },
  symptom: 'SSH tới port 22 bị từ chối dù console VPS còn hoạt động.', redHerring: 'Tên miền của VPS trả NXDOMAIN.',
  finding: 'Listener và cấu hình đều chỉ TCP/2222; cần xác nhận cấu hình hiệu lực, firewall và kết nối từ client.',
  overclaim: 'Mọi client đều đăng nhập được trên TCP/2222.', safeNext: 'Xác nhận port được chủ VPS dự định, kiểm tra sshd -t và firewall/ACL rồi hướng client dùng ssh -p 2222.',
  unsafe: 'Đổi lại port 22 qua phiên SSH duy nhất mà không có console/rollback.', verify: 'TCP/2222 và xác thực từ client được phép thành công.',
  wrongChecks: ['df -h /', 'free -h'],
  extras: [
    { command: 'sshd -T | grep port', output: 'port 2222', purpose: 'Đọc cấu hình sshd hiệu lực.', meaning: 'Effective port là 2222; vẫn cần thử đường TCP từ client.', commandId: 'sshd-effective', aliases: [] },
    { command: 'firewall-cmd --list-ports', output: '2222/tcp', purpose: 'Đọc port firewalld trong zone đang được hỏi.', meaning: 'Zone được hỏi cho TCP/2222; phải xác nhận active zone và provider ACL.', commandId: 'firewall-list', aliases: [] },
  ],
})
addBatchCase({
  id: 'VPS-02-002', skill: 'resolver-vs-ip', objective: 'Tách IP reachability khỏi khả năng phân giải tên và xác định resolver guest.',
  p1: { doc: 'ping', purpose: 'ICMP tới IP công cộng', meaning: 'IP 1.1.1.1 trả lời ICMP trong hai thử nghiệm; không chứng minh mọi TCP path khỏe.' },
  p2: { doc: 'dig-a', purpose: 'A record qua resolver hiện tại', meaning: 'dig timeout vì không liên lạc được DNS server được dùng; chưa biết resolver nào.' },
  symptom: 'Site mở theo IP nhưng tên miền không tải.', redHerring: 'Mọi gói IP ra ngoài đều bị chặn.',
  finding: 'Một phép thử IP thành công còn truy vấn DNS timeout; cần tìm resolver và đường tới nó.',
  overclaim: 'Bản ghi A của example.com chắc chắn không tồn tại.', safeNext: 'Đọc resolv.conf và DNS từ NetworkManager, thử trực tiếp resolver đã cấu hình trước khi sửa.',
  unsafe: 'Ghi đè /etc/resolv.conf bằng IP đoán mà không xem network profile.', verify: 'Resolver được cấu hình trả A record và truy cập site theo domain hoạt động.',
  wrongChecks: ['df -h /', 'systemctl status nginx'],
})
addBatchCase({
  id: 'VPS-02-003', skill: 'network-profile', objective: 'Đọc interface và NetworkManager profile trước khi thay đổi kết nối có rủi ro mất SSH.',
  p1: { doc: 'ip-addr', purpose: 'địa chỉ trên interface guest', meaning: 'enp0s3 UP nhưng output không có IPv4 trên interface này.' },
  p2: { doc: 'nmcli-device-status', purpose: 'trạng thái NetworkManager device', meaning: 'NetworkManager báo enp0s3 disconnected; cần đối chiếu profile dự kiến.' },
  symptom: 'VPS chạy sau migration nhưng không thấy IPv4 ở guest.', redHerring: 'VPS có IPv4 nhưng chỉ DNS không hoạt động.',
  finding: 'Thiết bị có mặt nhưng chưa gắn profile IPv4 hoạt động; cần xem cấp phát và MAC/profile.',
  overclaim: 'Provider chắc chắn chưa cấp địa chỉ IPv4.', safeNext: 'Đối chiếu profile/MAC và thông tin cấp phát; dùng console và rollback nếu kích hoạt connection được duyệt.',
  unsafe: 'Chạy nmcli connection down qua phiên SSH quản trị duy nhất.', verify: 'Guest có IPv4, route đúng và TCP từ ngoài vào hoạt động.',
  wrongChecks: ['df -h /', 'dig example.com NS'],
})
addBatchCase({
  id: 'VPS-02-004', skill: 'https-firewall', objective: 'Phân biệt listener HTTPS trong guest với khả năng truy cập TCP/443 từ ngoài.',
  p1: { doc: 'ss-ltnp', purpose: 'listener TCP/443 trong guest', meaning: 'Có listener ở 0.0.0.0:443 tại thời điểm kiểm tra.' },
  p2: { doc: 'firewall-list', purpose: 'dịch vụ và port được firewalld liệt kê', meaning: 'Zone được hỏi chỉ liệt kê ssh, không có https/443; cần xác nhận zone active.' },
  symptom: 'HTTPS ngoài VPS không tới được, còn local curl thành công.', redHerring: 'Nginx không thể bind port 443 ở guest.',
  finding: 'Guest nghe 443 nhưng firewalld zone được hỏi không cho thấy HTTPS; cần test từ client và xác nhận zone.',
  overclaim: 'Chắc chắn chỉ có guest firewall, không có edge filtering.', safeNext: 'Xác nhận active zone, local HTTPS và client TCP; chỉ thêm rule HTTPS theo policy khi được duyệt.',
  unsafe: 'Tắt toàn bộ firewalld để làm website hoạt động.', verify: 'HTTPS từ client ngoài trả nội dung mong đợi, rule còn hiệu lực.',
  wrongChecks: ['df -h /', 'free -h'],
})
addBatchCase({
  id: 'VPS-02-005', skill: 'ipv4-provisioning', objective: 'Phân biệt IPv6 còn hoạt động với IPv4 thiếu ở guest và kiểm tra cấp phát trước khi sửa profile.',
  p1: { doc: 'ip-family-addr', purpose: 'địa chỉ IPv6 của enp0s3', meaning: 'Guest có IPv6 2001:db8:100::25/64 trên enp0s3.' },
  p2: { doc: 'ip-family-addr', purpose: 'địa chỉ IPv4 của enp0s3', meaning: 'Output không có dòng inet IPv4; cần kiểm tra panel và profile.' },
  symptom: 'IPv6 hoạt động nhưng IPv4 SSH thất bại từ các client.', redHerring: 'Chỉ một user nhập sai mật khẩu SSH.',
  finding: 'Guest có IPv6 nhưng không có IPv4 trên interface; chưa biết thiếu ở cấp phát hay profile.',
  overclaim: 'IPv4 chưa từng được provider cấp cho VPS.', safeNext: 'Đối chiếu IPv4 được panel cấp với profile guest rồi khôi phục có console, approval và rollback.',
  unsafe: 'Tự đoán một IPv4 trong subnet rồi gán cho guest.', verify: 'IPv4 xuất hiện, route IPv4 đúng và TCP/22 từ client thành công.',
  wrongChecks: ['df -h /', 'dig example.com NS'],
  extras: [{ command: 'PANEL: IPv4 allocation for enp0s3', output: 'Assigned IPv4: 192.0.2.25/24; gateway: 192.0.2.1', purpose: 'Đối chiếu địa chỉ IPv4 provider cấp.', meaning: 'Panel có địa chỉ cấp phát; chưa chứng minh guest đã cấu hình đúng.', commandId: 'panel-ip-allocation', aliases: [], context: 'panel' }],
})
addBatchCase({
  id: 'VPS-02-007', skill: 'source-dependent-path', objective: 'Điều tra reachability theo nguồn với bằng chứng client, guest và edge; không đoán nguyên nhân BGP/ACL.',
  p1: { doc: 'panel-probes', purpose: 'TCP/22 từ ba điểm quan sát', meaning: 'Tokyo kết nối được; hai ISP nội địa timeout theo panel; chưa biết gói bị chặn ở đâu.', context: 'panel' },
  p2: { doc: 'sshd-effective', purpose: 'port hiệu lực của sshd', meaning: 'sshd được cấu hình port 22; không chứng minh gói từ ISP bị ảnh hưởng tới guest.' },
  symptom: 'VPS tới được từ Nhật nhưng timeout từ hai ISP nội địa.', redHerring: 'sshd từ chối mật khẩu cho mọi client.',
  finding: 'Lỗi phụ thuộc nguồn; SSH port 22 được cấu hình nhưng đường đi hoặc filtering còn cần chứng cứ.',
  overclaim: 'Đã xác định chính xác một ISP hoặc BGP peer gây lỗi.', safeNext: 'Thu source IP, timestamp, TCP probe cùng port và capture giới hạn tại guest; chuyển đội mạng/edge khi cần.',
  unsafe: 'Đổi SSH port hoặc reboot VPS để che lỗi chưa được định vị.', verify: 'TCP/22 thành công từ các ISP từng lỗi ở nhiều thời điểm.',
  wrongChecks: ['df -h /', 'free -h'],
  extras: [
    { command: 'ss -ltnp', output: 'LISTEN 0 128 0.0.0.0:22 users:(("sshd",pid=881,fd=3))', purpose: 'Kiểm tra listener thật trong guest.', meaning: 'Guest nghe TCP/22; chưa chứng minh SYN từ ISP nội địa tới được guest.', commandId: 'ss-ltnp', aliases: [] },
    { command: 'PANEL: edge ACL summary', output: 'No source-specific edge ACL recorded for TCP/22', purpose: 'Đọc ACL edge được ghi nhận.', meaning: 'Không có rule được ghi nhận ở panel; không loại trừ upstream/routing hoặc rule khác.', commandId: 'panel-probes', aliases: [], context: 'panel' },
  ],
})
addBatchCase({
  id: 'VPS-03-002', skill: 'unix-permission', objective: 'Đọc owner/mode của thư mục và user chạy app trước khi đề xuất quyền ghi hẹp nhất.',
  p1: { doc: 'ls-permission', purpose: 'mode và owner của uploads', meaning: 'uploads thuộc root:root và mode 755; chỉ owner có write theo mode hiển thị.' },
  p2: { doc: 'id-user', purpose: 'UID/GID của process webapp', meaning: 'webapp UID/GID 1001 không phải root; cần xét ACL và thư mục cha nếu có.' },
  symptom: 'Ứng dụng báo Permission denied khi ghi vào uploads.', redHerring: 'Ứng dụng không thể resolve tên miền.',
  finding: 'Mode 755 root:root không cấp write cho webapp theo quyền cơ bản; ACL/mount cần đối chiếu nếu có.',
  overclaim: 'Chắc chắn mọi thư mục cha và ACL đều cho phép truy cập.', safeNext: 'Kiểm tra namei/getfacl và owner mục tiêu; thay quyền hẹp theo owner approval, tránh world-writable.',
  unsafe: 'chmod -R 777 /srv/app/uploads để sửa nhanh.', verify: 'webapp ghi được file thử và quyền vẫn theo least privilege.',
  wrongChecks: ['dig example.com A', 'ip route'],
})
addBatchCase({
  id: 'VPS-03-004', skill: 'selinux-avc', objective: 'Đọc AVC theo process và đường dẫn để xử lý context/policy, không tắt SELinux.',
  p1: { doc: 'getenforce', purpose: 'chế độ SELinux', meaning: 'SELinux hiện Enforcing; riêng mode chưa xác định rule nào chặn.' },
  p2: { doc: 'ausearch-avc', purpose: 'AVC denial gần đây cho httpd uploads', meaning: 'AVC ghi httpd bị deny write ở uploads; cần đối chiếu thời gian, context và intended access.' },
  symptom: 'App chỉ ghi được khi SELinux permissive, thất bại khi Enforcing.', redHerring: 'VPS không có default route.',
  finding: 'AVC liên quan write của httpd hỗ trợ giả thuyết SELinux; cần đọc context và policy trước khi đổi.',
  overclaim: 'Có thể tắt SELinux vĩnh viễn mà không ảnh hưởng bảo mật.', safeNext: 'Đọc context và nguyên nhân AVC; sửa label/policy đúng phạm vi theo phê duyệt.',
  unsafe: 'Giữ setenforce 0 như giải pháp production.', verify: 'Tác vụ ghi hoạt động trong Enforcing và không có AVC liên quan mới.',
  wrongChecks: ['df -h /', 'dig example.com A'],
})
addBatchCase({
  id: 'VPS-03-005', skill: 'service-dependency', objective: 'Lần dependency chain từ app sang database và điều tra database trước khi restart app.',
  p1: { doc: 'systemctl-service', purpose: 'trạng thái unit myapp', meaning: 'myapp báo Dependency failed; chưa biết dependency nào đến khi đối chiếu unit và service liên quan.' },
  p2: { doc: 'systemctl-service', purpose: 'trạng thái unit mariadb', meaning: 'mariadb đang failed; cần journal để biết nguyên nhân database lỗi.' },
  symptom: 'Ứng dụng database không start sau reboot.', redHerring: 'Chỉ một client không resolve domain.',
  finding: 'App có dependency failure và database failed; nguyên nhân database vẫn chưa được xác định.',
  overclaim: 'Đã chứng minh dữ liệu MariaDB bị hỏng.', safeNext: 'Đọc journal mariadb và dependency graph; sửa nguyên nhân DB theo owner rồi mới khởi động app.',
  unsafe: 'Restart myapp liên tục và bỏ qua MariaDB failed.', verify: 'MariaDB khỏe, myapp active và endpoint ứng dụng trả đúng.',
  wrongChecks: ['dig example.com A', 'df -i /'],
  extras: [{ command: 'journalctl -u mariadb -b -n 80 --no-pager', output: 'mariadb.service: Failed to start due to missing /var/lib/mysql directory', purpose: 'Đọc lỗi MariaDB ở boot hiện tại.', meaning: 'Log nêu thiếu đường dẫn; cần kiểm tra mount/volume và backup trước khi tạo hoặc khôi phục dữ liệu.', commandId: 'journalctl-service', aliases: [] }],
})
addBatchCase({
  id: 'VPS-03-006', skill: 'service-runtime', objective: 'Phân biệt service auto-restart với lỗi runtime Python và đối chiếu môi trường deploy.',
  p1: { doc: 'systemctl-service', purpose: 'trạng thái custom-app', meaning: 'Unit liên tục auto-restart sau exit-code; restart lặp lại không sửa runtime.' },
  p2: { doc: 'journalctl-service', purpose: 'exception gần đây của custom-app', meaning: 'Log ghi ModuleNotFoundError: requests; cần xác định interpreter/venv thực được unit dùng.' },
  symptom: 'Custom daemon restart liên tục và không phục vụ request.', redHerring: 'Nginx trả certificate expired.',
  finding: 'App thoát do thiếu module trong runtime đang dùng; package manifest và unit ExecStart cần đối chiếu.',
  overclaim: 'Cài requests toàn hệ thống chắc chắn sửa đúng môi trường app.', safeNext: 'Xác nhận ExecStart/venv và manifest; sửa dependency trong đúng môi trường hoặc rollback release được duyệt.',
  unsafe: 'pip install vào system Python rồi restart production không kiểm tra venv.', verify: 'Service ổn định qua nhiều chu kỳ và healthcheck endpoint thành công.',
  wrongChecks: ['ip route', 'dig example.com NS'],
  extras: [{ command: 'systemctl cat custom-app', output: 'ExecStart=/opt/custom/venv/bin/python /opt/custom/app.py', purpose: 'Đọc interpreter unit thực dùng.', meaning: 'Unit dùng venv cụ thể; dependency phải khớp môi trường này.', commandId: 'systemctl-cat', aliases: [] }],
})
addBatchCase({
  id: 'VPS-04-001', skill: 'cpu-process', objective: 'Đọc mức CPU và process tại thời điểm chậm, rồi xác nhận workload trước khi can thiệp.',
  p1: { doc: 'top', purpose: 'CPU user trong snapshot top', meaning: '98.5% us cho thấy CPU dành nhiều cho user process tại thời điểm lấy mẫu.' },
  p2: { doc: 'ps-cpu', purpose: 'process đứng đầu theo CPU', meaning: 'python3 PID 2601 ở 97.4% CPU; cần đối chiếu script, owner và thời gian chạy.' },
  symptom: 'VPS chậm khi script định kỳ chạy.', redHerring: 'VPS bị mất địa chỉ IPv4.',
  finding: 'CPU user cao đồng thời một process python3 dùng gần một core; cần xác nhận nó là script dự kiến.',
  overclaim: 'Script chắc chắn độc hại và cần kill ngay.', safeNext: 'Xác định owner, lịch và tác động của PID 2601; phối hợp tối ưu hoặc dời lịch nếu được duyệt.',
  unsafe: 'Kill PID 2601 ngay mà không biết công việc của nó.', verify: 'Độ trễ khách giảm và CPU trở lại baseline ở lần chạy tương đương.',
  wrongChecks: ['dig example.com A', 'df -i /'],
})
addBatchCase({
  id: 'VPS-04-002', skill: 'memory-swap', objective: 'Dùng available memory và swap in/out để phân biệt áp lực RAM với CPU.',
  p1: { doc: 'free-h', purpose: 'available RAM và swap đã dùng', meaning: 'Chỉ còn 40Mi available, swap dùng 490/512Mi; một ảnh chụp cần đối chiếu hoạt động swap.' },
  p2: { doc: 'vmstat', purpose: 'swap in/out trong vmstat', meaning: 'si 280 và so 310 cho thấy swapping đang diễn ra trong mẫu.' },
  symptom: 'VPS chậm dù CPU không bận rõ rệt.', redHerring: 'SSH chỉ lỗi từ một địa chỉ IP.',
  finding: 'RAM available thấp và swap đang hoạt động; phù hợp memory pressure, chưa định process gây ra.',
  overclaim: 'Đã xác định ứng dụng nào bị memory leak.', safeNext: 'Đọc RSS/process và xu hướng, kiểm tra OOM; điều chỉnh workload hoặc RAM với chủ dịch vụ.',
  unsafe: 'Tắt swap và reboot ngay khi chưa biết workload.', verify: 'si/so giảm, available cải thiện và ứng dụng ổn định khi tải tương đương.',
  wrongChecks: ['dig example.com NS', 'firewall-cmd --list-all'],
})
addBatchCase({
  id: 'VPS-04-003', skill: 'oom-killer', objective: 'Liên hệ kernel OOM event với unit app và kiểm tra giới hạn bộ nhớ trước khi tăng tài nguyên.',
  p1: { doc: 'journal-boot', purpose: 'kernel log về process bị kill', meaning: 'Kernel ghi OOM và kill PID 2525 (java); cần đối chiếu thời điểm lỗi.' },
  p2: { doc: 'systemctl-service', purpose: 'kết quả unit app', meaning: 'systemd ghi Result: oom-kill cho app; chưa biết memory peak hoặc giới hạn cgroup.' },
  symptom: 'Ứng dụng kết thúc ngẫu nhiên mà không hiện lỗi cho khách.', redHerring: 'Chỉ website báo TLS certificate expired.',
  finding: 'Kernel OOM kill và unit oom-kill cùng chỉ vào app; cần xác định giới hạn và peak bộ nhớ.',
  overclaim: 'Chắc chắn chỉ cần tăng RAM, không cần điều tra heap hoặc cgroup.', safeNext: 'Đối chiếu thời gian OOM, RAM/cgroup limit và Java heap; thay cấu hình hoặc capacity theo owner.',
  unsafe: 'Tăng heap tối đa lên toàn bộ RAM VPS mà không kiểm tra limit.', verify: 'Không còn OOM khi chạy workload tương đương, ứng dụng vẫn ổn định.',
  wrongChecks: ['dig example.com A', 'ss -ltnp'],
  extras: [{ command: 'free -h', output: 'Mem: 2.0Gi total 80Mi available; Swap: 1.0Gi total 920Mi used', purpose: 'Đọc bộ nhớ hiện tại sau sự kiện OOM.', meaning: 'Snapshot vẫn cho thấy ít available; không xác định một mình peak khi kill.', commandId: 'free-h', aliases: [] }],
})
addBatchCase({
  id: 'VPS-04-004', skill: 'io-wait', objective: 'Phân biệt CPU user thấp với I/O wait cao, rồi xác minh device và host trước kết luận.',
  p1: { doc: 'vmstat', purpose: 'tỷ lệ CPU wa của vmstat', meaning: 'wa 76% trong mẫu phản ánh nhiều thời gian CPU chờ I/O; cần đối chiếu các mẫu.' },
  p2: { doc: 'iostat', purpose: 'await và %util của vda', meaning: 'vda await 180ms, %util 99% trong mẫu; cần so với baseline và workload.' },
  symptom: 'VPS chậm dù CPU user thấp.', redHerring: 'Chỉ DNS record của domain bị sai.',
  finding: 'wa cao cùng độ trễ I/O vda cao phù hợp nghẽn storage, chưa định nguồn workload hay host.',
  overclaim: 'Đã chứng minh đĩa vật lý hỏng.', safeNext: 'Tìm process I/O, đối chiếu host metrics và disk health; chuyển storage team nếu có dấu hiệu node.',
  unsafe: 'Xóa dữ liệu ứng dụng để giảm I/O mà không xác định nguồn.', verify: 'await và độ trễ ứng dụng trở lại baseline dưới tải tương đương.',
  wrongChecks: ['dig example.com A', 'firewall-cmd --list-all'],
})
addBatchCase({
  id: 'VPS-04-005', skill: 'cpu-cgroup', objective: 'Đọc cgroup throttling cùng container stats và limit, không suy luận chỉ từ host CPU.',
  p1: { doc: 'cgroup-cpu-stat', purpose: 'cgroup cpu.stat và số lần throttled', meaning: '760/1400 periods bị throttled trong counter; cần biết khoảng đo và quota cấu hình.' },
  p2: { doc: 'docker-stats', purpose: 'CPU container api tại thời điểm đo', meaning: 'api được báo 99.8% CPU trong snapshot; không tự chứng minh host hết CPU.' },
  symptom: 'Container api chậm lúc cao điểm dù host CPU còn dư.', redHerring: 'VPS không có default route.',
  finding: 'Có dấu hiệu quota throttling; cần đối chiếu CPU limit, lưu lượng và latency cùng thời gian.',
  overclaim: 'CPU vật lý của host chắc chắn đã cạn.', safeNext: 'Đọc giới hạn container/cgroup, request latency và traffic; điều chỉnh quota/capacity được duyệt.',
  unsafe: 'Bỏ mọi CPU limit production mà không kiểm tra tác động tenant khác.', verify: 'Tỷ lệ throttling và latency giảm ở tải cao điểm tương đương.',
  wrongChecks: ['dig example.com NS', 'df -i /'],
  extras: [{ command: 'docker inspect api --format "{{.HostConfig.NanoCpus}}"', output: '1000000000', purpose: 'Đọc CPU quota cấu hình cho api.', meaning: 'NanoCpus 1e9 tương ứng giới hạn một CPU; cần đối chiếu cgroup đang dùng.', commandId: 'docker-inspect', aliases: [] }],
})
addBatchCase({
  id: 'VPS-05-003', skill: 'journal-retention', objective: 'Đo journal và filesystem rồi dọn theo retention có phê duyệt, không xóa log mù.',
  p1: { doc: 'journal-disk-usage', purpose: 'dung lượng active và archived journal', meaning: 'Journal dùng 8.0G; con số gồm active và archived, không bằng toàn bộ /var/log.' },
  p2: { doc: 'df-h', purpose: 'block usage của root filesystem', meaning: '/ đang 94% theo fixture; còn chỗ nhưng cần ngăn tăng trưởng.' },
  symptom: 'Log hệ thống chiếm phần lớn ổ đĩa.', redHerring: 'Không có IPv4 trên interface.',
  finding: 'Journal lớn và / dùng 94%; cần tìm nguồn log tăng và retention hợp lệ.',
  overclaim: 'Có thể xóa toàn bộ /var/log mà không ảnh hưởng bằng chứng.', safeNext: 'Xác nhận retention/backup, rà nguồn log; vacuum archived journal trong phạm vi được duyệt.',
  unsafe: 'rm -rf /var/log để lấy chỗ ngay.', verify: 'df và journal usage giảm, log cần thiết vẫn còn và app ghi được.',
  wrongChecks: ['dig example.com A', 'ss -ltnp'],
})
addBatchCase({
  id: 'VPS-05-005', skill: 'disk-grow-layers', objective: 'Phân biệt virtual disk, partition và filesystem trước khi lập kế hoạch mở rộng.',
  p1: { doc: 'lsblk', purpose: 'kích thước vda và partition vda1', meaning: 'vda đã 40G nhưng vda1 còn 20G; chưa biết filesystem type hay layout.' },
  p2: { doc: 'df-h', purpose: 'kích thước filesystem chứa /', meaning: '/dev/vda1 vẫn báo filesystem 20G; disk 40G chưa tự mở rộng filesystem.' },
  symptom: 'Sau nâng disk lên 40G, Linux vẫn báo / chỉ 20G.', redHerring: 'SSH bị ban theo IP văn phòng.',
  finding: 'Disk lớn hơn partition và filesystem; cần kiểm tra layout/FS trước khi chọn quy trình grow.',
  overclaim: 'Có thể chạy xfs_growfs mà không cần xem filesystem type.', safeNext: 'Kiểm tra partition layout, filesystem type và backup; lập change plan grow đúng lớp với quyền và rollback.',
  unsafe: 'Sửa partition trực tiếp trên production khi chưa có backup/layout.', verify: 'lsblk và df phản ánh dung lượng dự kiến, filesystem khỏe và dữ liệu đọc được.',
  wrongChecks: ['dig example.com A', 'ss -ltnp'],
  extras: [{ command: 'findmnt -no SOURCE,FSTYPE /', output: '/dev/vda1 xfs', purpose: 'Xác nhận nguồn và filesystem type của root.', meaning: 'Root dùng XFS trong fixture; vẫn cần mở rộng partition trước khi grow filesystem.', commandId: 'findmnt', aliases: [] }],
})
addBatchCase({
  id: 'VPS-05-006', skill: 'deleted-open-file', objective: 'Giải thích vì sao xóa file chưa giải phóng block khi process còn giữ file descriptor.',
  p1: { doc: 'df-h', purpose: 'block usage của root sau xóa log', meaning: '/ vẫn 95% sau thao tác xóa; cần so với open file handles.' },
  p2: { doc: 'lsof-deleted', purpose: 'file đã unlink nhưng còn được process mở', meaning: 'java PID 2300 giữ app.log (deleted) 5G; block có thể chưa được giải phóng.' },
  symptom: 'Đã xóa log lớn nhưng df gần như không giảm.', redHerring: 'DNS trả IP cũ sau migration.',
  finding: 'Deleted file 5G còn open bởi PID 2300 là ứng viên giải thích block chưa được giải phóng.',
  overclaim: 'Kill -9 mọi process java là an toàn.', safeNext: 'Xác nhận PID/service owner và log rotation; phối hợp reopen/restart graceful nếu được duyệt.',
  unsafe: 'Kill -9 PID 2300 ngay trên dịch vụ đang phục vụ khách.', verify: 'lsof +L1 hết handle liên quan và df tăng free space; app vẫn khỏe.',
  wrongChecks: ['dig example.com NS', 'ip route'],
  extras: [{ command: 'ps -p 2300 -o pid,comm,args', output: 'PID COMMAND COMMAND\n2300 java /usr/bin/java -jar /srv/app/api.jar', purpose: 'Nhận diện process giữ file descriptor.', meaning: 'PID 2300 là app Java; cần phối hợp với owner trước restart.', commandId: 'ps-process', aliases: [] }],
})
addBatchCase({
  id: 'VPS-05-007', skill: 'filesystem-integrity', objective: 'Đọc kernel error và fsck failure, bảo vệ dữ liệu trước mọi sửa chữa filesystem.',
  p1: { doc: 'journal-boot', purpose: 'kernel error của filesystem', meaning: 'Kernel ghi EXT4-fs error trên /dev/vda1; có rủi ro integrity.' },
  p2: { doc: 'systemctl-failed', purpose: 'unit fsck bị fail', meaning: 'systemd-fsck@dev-vda1.service failed; cần log chi tiết và trạng thái mount.' },
  symptom: 'VPS vào rescue mode sau sự cố storage.', redHerring: 'Chỉ một URL trả 404.',
  finding: 'Filesystem có lỗi và fsck unit thất bại; cần quy trình recovery/offline và backup.',
  overclaim: 'Có thể chạy fsck -y trên filesystem đang mount đọc ghi.', safeNext: 'Giữ trạng thái, kiểm tra backup và disk health, chuyển đội storage để repair offline có kế hoạch.',
  unsafe: 'Chạy fsck -y trực tiếp trên root filesystem đang mounted.', verify: 'Filesystem mount sạch sau repair, dữ liệu ứng dụng được kiểm tra và boot ổn định.',
  wrongChecks: ['dig example.com A', 'curl -I http://127.0.0.1'],
  extras: [
    { command: 'findmnt -no SOURCE,OPTIONS /', output: '/dev/vda1 ro,relatime', purpose: 'Đọc mode mount của root trong rescue.', meaning: 'Root đang ro; không thử ghi hoặc sửa online.', commandId: 'findmnt', aliases: [] },
    { command: 'PANEL: verified backup status', output: 'Last verified backup: 2026-10-21 00:00 UTC', purpose: 'Xác nhận mốc backup trước recovery.', meaning: 'Có một bản backup đã kiểm tra; cần xác nhận phạm vi và RPO với khách.', commandId: 'panel-backup-status', aliases: [], context: 'panel' },
  ],
})
addBatchCase({
  id: 'VPS-07-002', skill: 'http-403-index', objective: 'Phân biệt 403 do index/directory listing với permission và policy truy cập.',
  p1: { doc: 'curl-head', purpose: 'HTTP status từ localhost', meaning: 'HTTP local trả 403; server đã phản hồi, không phải connection refused.' },
  p2: { doc: 'nginx-error-tail', purpose: 'dòng Nginx error về directory index', meaning: 'Nginx từ chối directory index ở /srv/site/; cần kiểm tra index và intended access.' },
  symptom: 'Website mở được nhưng trả 403 Forbidden.', redHerring: 'TCP tới web server bị từ chối hoàn toàn.',
  finding: 'Nginx phản hồi 403 và log nêu directory index forbidden; chưa biết index file dự kiến có tồn tại.',
  overclaim: 'Chắc chắn phải bật autoindex công khai cho thư mục.', safeNext: 'Đối chiếu root/index và nội dung deploy; thêm index/route đúng theo owner, giữ access control.',
  unsafe: 'Bật autoindex cho toàn bộ site production để hết 403.', verify: 'URL mong đợi tải đúng trang và thư mục nhạy cảm không bị liệt kê.',
  wrongChecks: ['ip route', 'free -h'],
})
addBatchCase({
  id: 'VPS-07-004', skill: 'http-upstream', objective: 'Đọc 502 cùng Nginx log để điều tra backend TCP/3000 thay vì restart proxy mù.',
  p1: { doc: 'systemctl-nginx', purpose: 'trạng thái Nginx', meaning: 'Nginx active; một proxy chạy vẫn có thể trả lỗi upstream.' },
  p2: { doc: 'nginx-error-tail', purpose: 'lỗi kết nối upstream trong Nginx log', meaning: 'Nginx không kết nối được 127.0.0.1:3000 ở thời điểm log; cần kiểm tra backend listener.' },
  symptom: 'Domain trả 502 Bad Gateway.', redHerring: 'Không có HTTP response do Nginx dừng hoàn toàn.',
  finding: 'Proxy active nhưng upstream TCP/3000 từ chối; cần kiểm tra backend và cấu hình upstream.',
  overclaim: 'Nginx restart chắc chắn sửa được backend.', safeNext: 'Đọc listener TCP/3000, backend status/log và target upstream; sửa đúng service sau approval.',
  unsafe: 'Restart Nginx liên tục mà không kiểm tra backend.', verify: 'Backend health và HTTP từ ngoài trả nội dung đúng, không còn 502.',
  wrongChecks: ['df -i /', 'dig example.com NS'],
})
addBatchCase({
  id: 'VPS-07-006', skill: 'http-503-backend', objective: 'Phân biệt 503 sau deploy với tình trạng unit app auto-restart và điều tra release.',
  p1: { doc: 'curl-head', purpose: 'HTTP status sau deploy', meaning: 'Local HTTP trả 503; proxy/ứng dụng vẫn phản hồi lỗi, không chứng minh DNS hỏng.' },
  p2: { doc: 'systemctl-service', purpose: 'trạng thái unit app', meaning: 'app auto-restart; cần log và healthcheck để biết nguyên nhân crash hoặc chưa ready.' },
  symptom: 'Website trả 503 ngay sau deploy.', redHerring: 'Domain không có A record.',
  finding: 'HTTP 503 cùng unit auto-restart gợi vấn đề app/release; cần log và readiness.',
  overclaim: 'Đã chứng minh Nginx config syntax sai.', safeNext: 'Đọc app journal, deploy diff và readiness; rollback release nếu runbook/owner cho phép.',
  unsafe: 'Reload proxy liên tục và bỏ qua app auto-restart.', verify: 'App ổn định và URL trả nội dung đúng dưới request thực.',
  wrongChecks: ['dig example.com NS', 'df -i /'],
  extras: [{ command: 'journalctl -u app -n 30 --no-pager', output: 'app.service: Main process exited, code=exited, status=1/FAILURE\napp: missing required APP_CONFIG', purpose: 'Đọc lỗi app sau deploy.', meaning: 'Config APP_CONFIG thiếu trong runtime; cần đối chiếu release/secret qua quy trình, không in giá trị secret.', commandId: 'journalctl-service', aliases: [] }],
})
addBatchCase({
  id: 'VPS-07-007', skill: 'tls-sni-vhost', objective: 'Đọc chứng chỉ theo SNI và vhost, tách DNS/cert coverage trước thay đổi TLS.',
  probeOverrides: { P2: '# configuration file /etc/nginx/nginx.conf:\nevents {}\nhttp { include /etc/nginx/conf.d/*.conf; }\n# configuration file /etc/nginx/conf.d/api.conf:\nserver { listen 443 ssl default_server; server_name api.example.com; ssl_certificate /etc/pki/tls/certs/api.crt; ssl_certificate_key /etc/pki/tls/private/api.key; }' },
  p1: { doc: 'openssl-sni', purpose: 'chứng chỉ trả về cho shop.example.com theo SNI', meaning: 'Endpoint 198.51.100.20:443 trả cert CN api.example.com; cần xem SAN và vhost.' , context: 'client' },
  p2: { doc: 'nginx-dump', purpose: 'server_name trong Nginx config trên đĩa', meaning: 'Guided fixture chỉ có vhost mặc định api.example.com; phải đối chiếu cấu hình chạy thực và cert theo SNI.' },
  symptom: 'Chỉ một domain trên VPS báo cảnh báo certificate.', redHerring: 'Toàn VPS không phản hồi TCP/443.',
  finding: 'SNI shop nhận cert api và config không thấy vhost shop; DNS, SAN và mapping cần đối chiếu.',
  overclaim: 'Chỉ cần tắt kiểm tra TLS ở browser của khách.', safeNext: 'Xác minh DNS A/AAAA, vhost và SAN; deploy cert bao phủ domain và mapping đúng sau phê duyệt.',
  unsafe: 'Bật bỏ qua TLS verification cho toàn bộ khách truy cập.', verify: 'Kết nối SNI tới domain trả chain hợp lệ bao phủ shop.example.com và trang đúng.',
  wrongChecks: ['df -h /', 'free -h'],
  extras: [
    { command: 'dig +short shop.example.com A', output: '198.51.100.20', purpose: 'Đối chiếu domain tới đúng IP đang kiểm tra TLS.', meaning: 'A record trỏ IP đang thử; AAAA/IPv6 và cache cũng cần cân nhắc.', commandId: 'dig-a', aliases: [], context: 'client' },
    { command: 'PANEL: certificate inventory', output: 'Installed certificate names: api.example.com only', purpose: 'Đọc certificate inventory ở panel.', meaning: 'Panel chỉ ghi cert api; cần xác minh cert thực được Nginx nạp và SAN.', commandId: 'panel-cert-inventory', aliases: [], context: 'panel' },
  ],
})
addBatchCase({
  id: 'VPS-08-001', skill: 'dns-a-cutover', objective: 'So sánh A record đang trả với IP VPS được cấp và quyền chỉnh zone.',
  p1: { doc: 'dig-a', purpose: 'A record shop.example.test từ resolver hiện tại', meaning: 'Resolver trả 203.0.113.10; một điểm truy vấn chưa chứng minh authoritative zone hiện tại.' , context: 'client' },
  p2: { doc: 'panel-ip-allocation', purpose: 'IP mới được panel cấp', meaning: 'Panel ghi VPS mới dùng 198.51.100.20; cần xác nhận đây là target cutover.', context: 'panel' },
  symptom: 'Domain vẫn mở server cũ sau migration.', redHerring: 'VPS mới không có địa chỉ IPv4.',
  finding: 'A record nhìn thấy khác IP VPS mới; cần kiểm tra authoritative zone và kế hoạch cutover.',
  overclaim: 'Mọi resolver trên Internet chắc chắn đều có cùng A record cũ.', safeNext: 'Xác nhận owner, authoritative NS và cutover; cập nhật A record ở zone có thẩm quyền khi được duyệt.',
  unsafe: 'Xóa zone cũ ngay khi chưa xác nhận delegation/cache.', verify: 'Authoritative answer đúng IP mới và website của khách hoạt động qua domain.',
  wrongChecks: ['df -h /', 'systemctl status sshd'],
})
addBatchCase({
  id: 'VPS-08-004', skill: 'guest-resolver', objective: 'Tách HTTP theo IP thành công khỏi DNS guest timeout, kiểm tra resolver và profile.',
  p1: { doc: 'curl-head', purpose: 'HTTP tới IP trực tiếp', meaning: 'HTTP theo IP trả 200; không chứng minh DNS name resolution hoạt động.' },
  p2: { doc: 'dig-a', purpose: 'DNS A query qua resolver mặc định', meaning: 'dig timeout và không tới DNS server; cần xác định resolver cấu hình.' },
  symptom: 'VPS tới IP công cộng được nhưng không resolve domain.', redHerring: 'Mọi kết nối HTTP tới IP đều thất bại.',
  finding: 'IP HTTP thành công còn DNS query timeout; nghi resolver hoặc đường tới resolver, chưa biết bản ghi domain sai.',
  overclaim: 'example.com chắc chắn không có bản ghi A.', safeNext: 'Đọc resolv.conf, NetworkManager DNS và thử resolver được cấu hình; sửa theo policy.',
  unsafe: 'Ghi đè DNS guest bằng địa chỉ ngẫu nhiên mà không kiểm tra profile.', verify: 'dig và ứng dụng phân giải tên thành công bằng resolver hợp lệ.',
  wrongChecks: ['df -h /', 'systemctl status nginx'],
})
addBatchCase({
  id: 'VPS-08-005', skill: 'dns-cache-authority', objective: 'So sánh authoritative với recursive answer và TTL trước khi nói propagation hoàn tất.',
  p1: { doc: 'dig-a', purpose: 'A record từ authoritative.example', meaning: 'Authoritative được hỏi trả 198.51.100.20; cần biết các NS có đồng nhất không.', context: 'client' },
  p2: { doc: 'dig-a', purpose: 'A record từ recursive 1.1.1.1', meaning: '1.1.1.1 còn trả IP cũ với TTL 120; cache có thể chưa hết.', context: 'client' },
  symptom: 'Một số người dùng còn tới server cũ sau đổi DNS.', redHerring: 'VPS mới đã tắt Nginx.',
  finding: 'Một authoritative trả IP mới trong khi resolver 1.1.1.1 còn IP cũ; cần so nhiều NS/resolver.',
  overclaim: 'Mọi authoritative nameserver đều chắc chắn trả IP mới.', safeNext: 'Kiểm tra các authoritative NS và TTL thực từ nhiều resolver; chờ cache hợp lệ hoặc xử lý bất nhất.',
  unsafe: 'Xóa server cũ ngay khi recursive vẫn trả IP cũ.', verify: 'Các authoritative thống nhất và resolver từng lỗi hội tụ về IP mới sau TTL.',
  wrongChecks: ['df -h /', 'free -h'],
  extras: [{ command: 'dig @9.9.9.9 shop.example.com A', output: 'shop.example.com. 80 IN A 198.51.100.20', purpose: 'So sánh recursive khác ở cùng thời điểm.', meaning: 'Resolver này đã thấy IP mới; cache giữa resolver khác nhau là có thể.', commandId: 'dig-a', aliases: [], context: 'client' }],
})
addBatchCase({
  id: 'VPS-08-007', skill: 'dns-ptr-mail', objective: 'Phân biệt reverse DNS PTR với forward A và quyền đổi rDNS của IP provider.',
  p1: { doc: 'dig-ptr', purpose: 'PTR reverse lookup của IP gửi mail', meaning: 'Reverse lookup trả NXDOMAIN; chưa biết forward A hay chính sách mail khác.', context: 'client' },
  p2: { doc: 'panel-rdns', purpose: 'cấu hình reverse DNS ở panel provider', meaning: 'Panel ghi reverse DNS chưa được đặt; thay đổi thuộc IP owner/provider.', context: 'panel' },
  symptom: 'Mail provider từ chối SMTP outbound vì thiếu reverse DNS.', redHerring: 'Website domain trả HTTP 403.',
  finding: 'PTR lookup NXDOMAIN và panel chưa đặt rDNS; cần xác nhận IP gửi thực, forward A và quyền provider.',
  overclaim: 'Chỉ thêm A record sẽ tự tạo PTR cho IP.', safeNext: 'Đối chiếu IP gửi và hostname forward; yêu cầu provider/IP owner đặt PTR theo policy.',
  unsafe: 'Sửa A record ngẫu nhiên và báo mail đã hoạt động.', verify: 'PTR của IP gửi trỏ hostname đúng, forward A khớp và mail provider chấp nhận thử gửi.',
  wrongChecks: ['df -h /', 'systemctl status nginx'],
  extras: [
    { command: 'dig mail.example.com A', output: 'mail.example.com. 300 IN A 198.51.100.20', purpose: 'Đối chiếu forward A của mail hostname.', meaning: 'Forward A khớp IP gửi trong fixture; PTR vẫn cần provider cấu hình.', commandId: 'dig-a', aliases: [], context: 'client' },
    { command: 'PANEL: outbound mail IP', output: 'Outbound SMTP source IP: 198.51.100.20', purpose: 'Xác nhận IP thực dùng gửi mail.', meaning: 'Đã có IP nguồn để yêu cầu rDNS; cần xác minh trên thử gửi sau thay đổi.', commandId: 'panel-rdns', aliases: [], context: 'panel' },
  ],
})
// Batch 3: priority topics. P1/P2 stay in the original dataset; the two
// source outputs containing editorial text are corrected only in Guided.
addBatchCase({
  id:'VPS-01-008', skill:'ssh-memory-correlation', objective:'Liên hệ rớt SSH với áp lực RAM khi chạy job nhưng không khẳng định sshd là process bị OOM kill.',
  p1:{doc:'journal-boot',purpose:'OOM event của kernel trong cùng đợt job',meaning:'Kernel đã kill python3; dòng này không ghi sshd bị kill.'}, p2:{doc:'free-h',purpose:'available RAM và swap',meaning:'Chỉ còn 64 MiB available và không có swap tại thời điểm đo.'},
  symptom:'SSH rớt từng đợt khi nightly job chạy.', redHerring:'SSH luôn báo host key changed ngay trước đăng nhập.',
  finding:'OOM kill python3 trùng giai đoạn RAM cạn; tác động trực tiếp tới phiên SSH vẫn cần log và tái kiểm tra.', overclaim:'Kernel đã kill sshd và chứng minh đây là nguyên nhân duy nhất của mọi lần rớt.',
  safeNext:'Thu timeline job, SSH log và memory trend; đề xuất giới hạn/tối ưu job với owner, chuyển cấp nếu VPS mất ổn định.', unsafe:'Tự reboot VPS và xóa job của khách.', verify:'Không còn OOM trong cửa sổ job, RAM đủ và phiên SSH ổn định qua nhiều lượt chạy.', wrongChecks:['dig example.com A','df -h /'],
  outputPrompt:'Kernel kill python3 và RAM còn 64 MiB; mức kết luận nào hợp lý?', decisionPrompt:'Khách muốn reboot ngay để hết rớt SSH. Bạn xử lý thế nào?',
  extras:[
    {command:'journalctl -u sshd --since "yesterday 23:00" --no-pager',output:'Oct 22 23:12:04 vps sshd[842]: pam_unix(sshd:session): session closed for user ops',purpose:'Đối chiếu sự kiện SSH theo thời điểm job.',meaning:'Có phiên đóng gần thời gian sự cố; log không ghi lý do đóng.',commandId:'journalctl-unit',aliases:[]},
    {command:'cat /proc/pressure/memory',output:'some avg10=24.12 avg60=11.34 avg300=4.20 total=8923012\nfull avg10=8.45 avg60=3.11 avg300=1.02 total=1981200',purpose:'Đọc áp lực bộ nhớ của guest.',meaning:'PSI cho thấy stall bộ nhớ trong cửa sổ đo; cần lấy trend cùng job.',commandId:'free-h',aliases:[]},
  ],
})
addBatchCase({
  id:'VPS-02-006',skill:'network-loss-scope',objective:'Đo loss end-to-end từ nhiều nguồn, không quy lỗi cho hop trung gian chỉ từ ICMP.',
  p1:{doc:'mtr',purpose:'loss end-to-end trên đường đo từ client',meaning:'Destination có 25% loss trên 20 lượt từ nguồn này; chưa định vị đoạn lỗi.',context:'client'}, p2:{doc:'ping',purpose:'ICMP tới đích từ cùng nguồn',meaning:'5/20 gói không nhận phản hồi, phù hợp loss tại thời điểm mẫu.',context:'client'},
  symptom:'SSH tới VPS Singapore chậm ngẫu nhiên.',redHerring:'VPS trả HTTP 403 cố định.',finding:'Hai phép đo cùng nguồn thấy 25% loss end-to-end; chưa biết lỗi ở access, transit hay đích.',overclaim:'Một hop MTR hạn chế ICMP chính là router hỏng.',
  safeNext:'Thu source IP, thời gian, nhiều đợt MTR và phép TCP từ nguồn bị ảnh hưởng; chuyển đội network nếu loss lặp lại.',unsafe:'Tự đổi route hoặc firewall VPS khách để thử.',verify:'TCP/SSH và end-to-end loss bình thường từ nguồn bị ảnh hưởng trong giờ từng lỗi.',wrongChecks:['free -h','systemctl status nginx'],
  outputPrompt:'Hai phép đo 20 gói cùng nguồn báo loss; bạn kết luận được phạm vi nào?',
  extras:[
    {command:'PANEL: network probe Singapore',output:'Source sg-probe-2 -> 203.0.113.20 TCP/22: 20/20 connected; median 12 ms',purpose:'So sánh nguồn khác gần đích.',meaning:'Probe khác ổn định; lỗi có thể theo đường/nguồn, chưa loại trừ gián đoạn ngắt quãng.',commandId:'panel-probes',aliases:[],context:'panel'},
    {command:'ip -s link show dev ens3',output:'2: ens3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    RX: bytes packets errors dropped missed mcast\n    105020 1130 0 0 0 0\n    TX: bytes packets errors dropped carrier collsns\n    99210 1060 0 0 0 0',purpose:'Kiểm tra error/drop trên NIC guest.',meaning:'Snapshot guest không thấy error/drop; không loại trừ đường client tới VPS.',commandId:'ip-link',aliases:[]},
  ],
})
addBatchCase({
  id:'VPS-02-008',skill:'vpn-path-mtu',objective:'Khoanh vùng PMTU trên VPN bằng kích thước gói và giới hạn ICMP, không tự sửa MTU production.',
  p1:{doc:'ping',purpose:'ICMP IPv4 DF với payload 1472 byte',meaning:'Gói DF lớn không đi qua path được; thông báo cần phân mảnh không xác định chính xác hop lỗi.',context:'client'}, p2:{doc:'ping',purpose:'ICMP IPv4 DF payload 1200 byte',meaning:'Gói nhỏ hơn nhận phản hồi trong cùng phép thử.',context:'client'},
  symptom:'Upload HTTPS lớn qua VPN treo, request nhỏ vẫn chạy.',redHerring:'Mọi request trả HTTP 401.',finding:'Kích thước lớn bị giới hạn còn kích thước nhỏ qua được; nghi PMTU/MSS trên path VPN, cần thêm phép đo TCP và chiều ngược.',overclaim:'Chắc chắn MTU VPS sai và phải đặt 1200 trên interface public.',
  safeNext:'Thu tracepath, MTU/MSS VPN và thử upload có giám sát; chuyển đội VPN/network với source, thời điểm, kích thước.',unsafe:'Tự hạ MTU interface khách từ phiên SSH duy nhất.',verify:'Upload lớn qua đúng VPN hoàn tất, không retransmit bất thường và request nhỏ vẫn hoạt động.',wrongChecks:['df -h /','systemctl status sshd'],
  outputPrompt:'1472 byte báo DF/fragmentation, 1200 byte nhận được; điều này hỗ trợ giả thuyết nào?',
  extras:[
    {command:'tracepath 198.51.100.20',output:' 1?: [LOCALHOST] pmtu 1500\n 1:  10.8.0.1  4.104ms\n 2:  no reply\n 3:  198.51.100.20  31.228ms',purpose:'Quan sát PMTU và hop từ client VPN.',meaning:'Tracepath không xác nhận được PMTU thấp ở hop im lặng; cần kiểm tra TCP và thiết bị VPN.',commandId:'mtr',aliases:[],context:'client'},
    {command:'PANEL: VPN tunnel settings',output:'Tunnel interface MTU: 1400; TCP MSS clamp: disabled',purpose:'Đọc cấu hình tunnel được phép xem.',meaning:'MTU tunnel nhỏ hơn 1500 là một giả thuyết phù hợp; cấu hình chưa chứng minh đây là nguyên nhân duy nhất.',commandId:'panel-probes',aliases:[],context:'panel'},
  ],
})
addBatchCase({
  id:'VPS-03-007',skill:'fd-exhaustion',objective:'Liên hệ EMFILE với limit và số FD thực tế; tách limit thấp khỏi rò rỉ FD chưa được chứng minh.',
  p1:{doc:'journalctl-service',purpose:'lỗi runtime của unit myapp',meaning:'App gặp EMFILE tại thời điểm ghi log; chưa biết vì sao số FD tăng.'},p2:{doc:'ps-process',purpose:'soft/hard open-file limit của PID 1234',meaning:'Process có soft và hard limit 1024 FD; cần so với FD đang mở.'},
  symptom:'API lỗi rải rác với Too many open files.',redHerring:'API bị lỗi DNS NXDOMAIN.',finding:'App có EMFILE, limit 1024 và gần chạm giới hạn; chưa chứng minh leak hay chỉ tải tăng hợp lệ.',overclaim:'Tăng LimitNOFILE vô hạn là đã sửa dứt điểm lỗi.',
  safeNext:'Đo FD qua tải, phân loại socket/file và xác nhận ownership; lập change tăng limit phù hợp hoặc sửa leak với đội ứng dụng.',unsafe:'Kill PID và tăng limit vô hạn ngay trên production.',verify:'Trong tải đại diện FD ổn định dưới limit, log không còn EMFILE và API thành công.',wrongChecks:['ip route','dig example.com A'],
  extras:[
    {command:'ls /proc/1234/fd | wc -l',output:'1008',purpose:'Đếm FD mở của PID tại snapshot.',meaning:'1008 gần soft limit 1024; số lượng một lần chưa chứng minh leak.',commandId:'ps-process',aliases:[]},
    {command:'systemctl show myapp -p LimitNOFILE',output:'LimitNOFILE=1024',purpose:'So limit unit với process.',meaning:'Unit đang đặt 1024; cần xem workload và cấu hình deploy trước khi đổi.',commandId:'systemctl-service',aliases:[]},
  ],
})
addBatchCase({
  id:'VPS-03-008',skill:'root-fs-integrity',objective:'Nhận diện root filesystem ro sau ext4 error và bảo vệ dữ liệu trước recovery.',
  p1:{doc:'findmnt',purpose:'mount option của root filesystem',meaning:'Root đang mount read-only; không phải chỉ quyền file thông thường.'},p2:{doc:'journal-boot',purpose:'lỗi ext4 trong kernel journal',meaning:'Kernel ghi nhận ext4 error; chưa định vị lỗi ở disk vật lý hay filesystem metadata.'},
  symptom:'Không thể tạo file, báo Read-only file system.',redHerring:'Chỉ một user nhập sai mật khẩu SSH.',finding:'Root ro đồng thời có ext4 error; nguy cơ integrity cần xử lý bởi đội hạ tầng theo runbook.',overclaim:'Đã xác định chính xác block disk hỏng và dữ liệu chắc chắn còn nguyên.',
  safeNext:'Ngừng tác vụ ghi, ghi nhận device/timestamp, kiểm tra backup; chuyển incident storage để recovery có phê duyệt.',unsafe:'Remount rw và chạy fsck trực tiếp trên root đang mount.',verify:'Sau recovery được duyệt, kiểm tra filesystem, kernel log và phép ghi ứng dụng an toàn.',wrongChecks:['dig example.com A','systemctl restart nginx'],
  extras:[
    {command:'journalctl -k -b --no-pager | tail -n 10',output:'Oct 22 07:14:02 vps kernel: EXT4-fs error (device vda1): ext4_find_entry: inode #2\nOct 22 07:14:02 vps kernel: EXT4-fs (vda1): Remounting filesystem read-only',purpose:'Đọc device và chuỗi sự kiện kernel.',meaning:'vda1 bị remount ro sau ext4 error; chưa kết luận lỗi vật lý.',commandId:'journal-boot',aliases:[]},
    {command:'PANEL: verified backup status',output:'Last verified backup: 2026-10-21 00:00 UTC; restore test: 2026-10-21 01:00 UTC',purpose:'Kiểm tra mốc backup được xác nhận.',meaning:'Có mốc khôi phục tham chiếu; phải đối chiếu RPO và phạm vi trước hành động.',commandId:'panel-backup-status',aliases:[],context:'panel'},
  ],
})
addBatchCase({
  id:'VPS-04-006',skill:'memory-trend',objective:'Đọc xu hướng RSS và OOM, phân biệt retention/leak với tăng theo workload.',
  p1:{doc:'ps-process',purpose:'RSS và uptime process myapp',meaning:'RSS khoảng 850 MB sau 9 giờ; một mẫu không chứng minh tăng đều.'},p2:{doc:'journal-boot',purpose:'OOM kill của myapp',meaning:'Kernel đã kill myapp; chưa xác định vì leak, tải hoặc giới hạn cgroup.'},
  symptom:'Daemon lớn dần rồi crash.',redHerring:'Website chỉ báo chứng chỉ TLS hết hạn.',finding:'Có OOM kill và các mẫu RSS tăng theo thời gian; nghi retention/leak nhưng cần profile theo workload.',overclaim:'Đã chứng minh một đoạn code cụ thể rò rỉ bộ nhớ.',
  safeNext:'Thu RSS/cgroup theo thời gian cùng tải và deployment; chuyển đội ứng dụng phân tích heap, đánh giá capacity có kiểm soát.',unsafe:'Tắt OOM killer hoặc reboot lặp lại để che lỗi.',verify:'RSS ổn định qua uptime/tải đại diện, không còn OOM và service đáp ứng.',wrongChecks:['ip route','dig example.com A'],
  extras:[
    {command:'PANEL: myapp memory samples',output:'00:00 RSS 240 MiB\n03:00 RSS 430 MiB\n06:00 RSS 660 MiB\n09:00 RSS 830 MiB',purpose:'Đọc các mẫu RSS sau deploy cùng phiên chạy.',meaning:'Xu hướng tăng rõ; chưa tách tác động volume request/cache hợp lệ.',commandId:'panel-probes',aliases:[],context:'panel'},
    {command:'systemctl show myapp -p MemoryMax',output:'MemoryMax=infinity',purpose:'Kiểm tra giới hạn unit.',meaning:'Không có MemoryMax của systemd; guest vẫn bị giới hạn RAM vật lý hoặc cgroup khác.',commandId:'systemctl-service',aliases:[]},
  ],
})
addBatchCase({
  id:'VPS-04-007',skill:'host-cpu-steal',objective:'Đối chiếu CPU steal của guest với node alert; chuyển cấp hạ tầng đúng quyền.',
  p1:{doc:'top',purpose:'CPU steal và user CPU trong guest',meaning:'Guest có 50% steal ở mẫu này dù user CPU thấp.'},p2:{doc:'panel-probes',purpose:'alert CPU contention của node',meaning:'Node-4 có alert contention; cần correlation nhiều mẫu và phạm vi VM.',context:'panel'},
  symptom:'VM chậm khi process trong guest dùng ít CPU.',redHerring:'App trả Permission denied vì thiếu account.',finding:'Steal cao đồng thời node alert; nhiều khả năng tranh chấp host, nhưng cần xác nhận timeline và VM khác.',overclaim:'Đã xác định chính xác VM hàng xóm gây lỗi và được phép migrate ngay.',
  safeNext:'Thu nhiều mẫu steal, latency và node metrics; mở incident cho hạ tầng đánh giá placement/capacity.',unsafe:'Tự migrate hoặc hard stop VM khách mà không có kế hoạch.',verify:'Steal giảm và latency ứng dụng bình thường sau xử lý của hạ tầng.',wrongChecks:['df -i /','dig example.com A'],
  extras:[
    {command:'vmstat 1 2',output:'procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----\n r  b swpd free buff cache si so bi bo in cs us sy id wa st\n 2  0    0 85240 18000 102400 0  0  0  0 240 320 5 4 41 0 50',purpose:'Đo CPU steal thêm một mẫu trong guest.',meaning:'Mẫu tiếp theo vẫn có st cao; cần trend và đối chiếu host.',commandId:'vmstat',aliases:[]},
    {command:'PANEL: node-4 contention window',output:'08:00-08:20 UTC CPU ready alert; 3 VMs affected',purpose:'Đối chiếu phạm vi node.',meaning:'Nhiều VM bị ảnh hưởng; đội hạ tầng cần xác nhận kế hoạch xử lý.',commandId:'panel-probes',aliases:[],context:'panel'},
  ],
})
addBatchCase({
  id:'VPS-04-008',skill:'backup-io-correlation',objective:'Đối chiếu thời gian backup với I/O wait và latency nhưng không khẳng định một lần trùng thời gian là nguyên nhân.',
  p1:{doc:'journalctl-service',purpose:'thời gian backup-agent chạy',meaning:'Backup chạy 02:00–02:20; log chưa nói tác động hiệu năng.'},p2:{doc:'iostat',purpose:'device await trong cửa sổ backup',meaning:'vda await 95 ms trong mẫu này; cần so baseline và workload.'},
  symptom:'Ứng dụng chậm ở khoảng 02:00 UTC.',redHerring:'SSH luôn thất bại vì sai username.',finding:'Backup và I/O latency cao trùng cửa sổ; nghi contention, cần so với ngày không backup và workload ứng dụng.',overclaim:'Chắc chắn backup-agent là lỗi duy nhất, có thể tắt backup ngay.',
  safeNext:'Thu iostat/latency nhiều ngày, đối chiếu schedule và yêu cầu owner điều chỉnh backup nếu xác nhận; chuyển hạ tầng khi device latency bất thường.',unsafe:'Tắt backup không có phương án bảo vệ dữ liệu.',verify:'Trong cửa sổ backup mới app đạt latency mục tiêu và bản backup vẫn hoàn tất, kiểm tra restore riêng.',wrongChecks:['dig example.com A','getent passwd admin'],
  extras:[
    {command:'PANEL: app latency samples',output:'01:30 UTC p95 120 ms\n02:05 UTC p95 2400 ms\n02:30 UTC p95 130 ms',purpose:'So latency trước, trong và sau backup.',meaning:'Latency tăng cùng cửa sổ I/O; vẫn cần loại trừ traffic và job khác.',commandId:'panel-probes',aliases:[],context:'panel'},
    {command:'PANEL: backup task result',output:'Backup task 2026-10-22 02:00 UTC: completed at 02:20 UTC',purpose:'Kiểm tra backup không thất bại trong cửa sổ.',meaning:'Task hoàn thành không chứng minh restore được.',commandId:'panel-backup-status',aliases:[],context:'panel'},
  ],
})
addBatchCase({
  id:'VPS-05-008',skill:'lvm-capacity-layers',objective:'Tách disk/PV/VG/LV/filesystem trước khi lên kế hoạch mở rộng dung lượng.',
  p1:{doc:'lsblk',purpose:'dung lượng disk, partition và LV',meaning:'vdb/vdb1 80G còn LV 30G; lsblk không cho biết filesystem đã grow.'},p2:{doc:'lvm-report',purpose:'free extents trong vgdata',meaning:'VG có 50G free; chưa được cấp vào LV.'},
  p1Override:'NAME          SIZE TYPE MOUNTPOINTS\nvdb            80G disk\n└─vdb1         80G part\n  └─vgdata-lvdata 30G lvm /data',p2Override:'VG      #PV #LV #SN Attr   VSize   VFree\nvgdata    1   1   0 wz--n- 79.99g 49.99g',
  symptom:'Disk đã resize nhưng filesystem /data vẫn báo hết chỗ.',redHerring:'VPS mất DNS sau đổi nameserver.',finding:'VG còn extents, LV /data vẫn 30G và filesystem gần đầy; cần xác nhận mapping cùng backup trước change.',overclaim:'Chỉ cần thấy vdb 80G là filesystem đã có 80G.',
  safeNext:'Xác nhận filesystem type, mapping, backup và quyền; lập change mở LV rồi grow filesystem bằng công cụ đúng loại.',unsafe:'Chạy mkfs trên vdb1 hoặc xóa dữ liệu /data.',verify:'lvs và df -h /data phản ánh dung lượng dự kiến, mount và ứng dụng vẫn đọc/ghi được.',wrongChecks:['free -h','dig example.com A'],
  extras:[
    {command:'lvs -o lv_name,vg_name,lv_size,lv_path',output:'LV     VG     LSize  Path\nlvdata vgdata 30.00g /dev/vgdata/lvdata',purpose:'Xác nhận LV mục tiêu.',meaning:'LV /data hiện 30G, phải map đúng trước change.',commandId:'lvm-report',aliases:[]},
    {command:'df -hT /data',output:'Filesystem                Type Size Used Avail Use% Mounted on\n/dev/mapper/vgdata-lvdata xfs   30G  29G  1.0G  97% /data',purpose:'Đọc filesystem type và block usage của /data.',meaning:'XFS gần đầy; lệnh grow filesystem phải phù hợp XFS sau khi LV tăng.',commandId:'df-hT',aliases:[]},
  ],
})
addBatchCase({
  id:'VPS-07-003',skill:'nginx-document-root',objective:'Đối chiếu Nginx root với đường dẫn deploy; không coi mô tả trong source P2 là stdout.',
  p1:{doc:'curl-head',purpose:'HTTP status local cho URL /start',meaning:'Nginx trả 404 local cho URL được hỏi; không tự nói file thiếu hay root sai.'},p2:{doc:'nginx-dump',purpose:'root directive của vhost đang dump',meaning:'Config trên disk khai báo root /var/www/html; cần so với deploy và vhost đang chạy.'},
  p2Override:'server {\n    listen 80;\n    server_name example.com;\n    root /var/www/html;\n}',
  symptom:'Sau deploy, mọi URL của site trả 404.',redHerring:'Trình duyệt chỉ cảnh báo chứng chỉ hết hạn.',finding:'Vhost dump dùng /var/www/html còn release có file dưới /srv/myapp/public; nghi root sai, cần xác nhận vhost phục vụ.',overclaim:'Chỉ từ HTTP 404 đã biết file bị xóa hoặc Nginx chưa chạy.',
  safeNext:'Kiểm tra vhost/Host header, xác nhận deploy path rồi đề xuất chỉnh root và reload có duyệt sau nginx -t.',unsafe:'Xóa /var/www/html và reinstall Nginx.',verify:'Host đúng trả nội dung /start mong đợi từ client, Nginx config test và log sạch.',wrongChecks:['ip route','free -h'],
  extras:[
    {command:'ls -l /srv/myapp/public/start',output:'-rw-r--r-- 1 deploy deploy 2840 Oct 22 06:10 /srv/myapp/public/start',purpose:'Xác nhận file của release tồn tại.',meaning:'File tồn tại ở deploy path; chưa chứng minh vhost đang phục vụ path đó.',commandId:'ls-permission',aliases:[]},
    {command:'curl -I -H "Host: example.com" http://127.0.0.1/start',output:'HTTP/1.1 404 Not Found\nServer: nginx',purpose:'Xác nhận đúng Host header khi hỏi localhost.',meaning:'Vhost được kiểm tra vẫn trả 404 trước change; cần đối chiếu server block và path.',commandId:'curl-head',aliases:[]},
  ],
})
addBatchCase({
  id:'VPS-07-005',skill:'tls-certificate-expiry',objective:'Đối chiếu certificate thực được phục vụ theo SNI với UTC, chain và lịch gia hạn.',
  p1:{doc:'openssl-sni',purpose:'ngày hết hạn cert theo SNI từ client',meaning:'Endpoint trả certificate có notAfter 2026-09-01; cần xác nhận đúng hostname/chain.',context:'client'},p2:{doc:'hostnamectl',purpose:'UTC khi kiểm tra',meaning:'Thời điểm fixture sau notAfter; cert này đã hết hạn.',context:'client'},
  symptom:'Browser báo certificate hết hạn.',redHerring:'HTTP 502 từ backend nhưng TLS bình thường.',finding:'Cert được endpoint phục vụ theo SNI đã quá notAfter; cần kiểm tra chain, vhost và automation gia hạn.',overclaim:'Chỉ cần thấy cert mới trong panel là client đã nhận cert mới.',
  safeNext:'Kiểm tra SAN/chain và renewal job; owner duyệt renew/install/reload có rollback, rồi thử từ client.',unsafe:'Tắt TLS validation ở client hoặc thay cert không kiểm tra hostname.',verify:'Client lấy đúng cert còn hạn theo SNI, chain hợp lệ và HTTPS trả nội dung mong đợi.',wrongChecks:['df -h /','ip route'],
  extras:[
    {command:'PANEL: certificate inventory',output:'example.com: renewed certificate available; deployed to Nginx: no',purpose:'Đối chiếu cert trong panel với cert đang phục vụ.',meaning:'Panel có cert mới nhưng chưa deploy; không thay thế phép kiểm tra TLS từ client.',commandId:'panel-cert-inventory',aliases:[],context:'panel'},
    {command:'systemctl status nginx',output:'● nginx.service - A high performance web server\n   Active: active (running)',purpose:'Xem Nginx đang phục vụ.',meaning:'Nginx active vẫn có thể đang dùng cert cũ.',commandId:'systemctl-nginx',aliases:[]},
  ],
})
addBatchCase({
  id:'VPS-07-008',skill:'upstream-timeout',objective:'Liên hệ 504 với latency backend dưới tải, kiểm tra dependency trước khi thay timeout.',
  p1:{doc:'nginx-error-tail',purpose:'Nginx upstream timeout trong error log',meaning:'Proxy chờ response header quá hạn; chưa biết vì CPU, DB hay network.'},p2:{doc:'curl-head',purpose:'thời gian health endpoint backend local',meaning:'Health endpoint mất 31.4 giây tại mẫu này; cần so với timeout và tải.'},
  symptom:'API trả 504 vào giờ cao điểm.',redHerring:'Nginx trả 404 cho một static asset.',finding:'Nginx timeout đọc backend và health local chậm; cần đo backend/DB dưới peak để khoanh nguyên nhân.',overclaim:'Tăng proxy_read_timeout vô hạn sẽ sửa backend.',
  safeNext:'Thu latency và resource/dependency trong peak, trace request ID; chuyển đội ứng dụng, chỉ đổi timeout theo SLA được duyệt.',unsafe:'Restart proxy lặp lại hoặc tăng timeout vô hạn.',verify:'Tải peak đại diện không còn 504, p95/p99 latency trong SLA và backend health ổn.',wrongChecks:['dig example.com A','df -i /'],
  extras:[
    {command:'systemctl status myapp',output:'● myapp.service - API\n   Active: active (running)',purpose:'Kiểm tra backend unit.',meaning:'Unit chạy không chứng minh response nhanh.',commandId:'systemctl-service',aliases:[]},
    {command:'PANEL: API peak latency',output:'19:00 UTC requests/min 4800; p95 28.1 s; 504 count 214\n20:00 UTC requests/min 920; p95 0.4 s; 504 count 0',purpose:'So latency và lỗi theo thời gian tải.',meaning:'Có tương quan peak; cần profile DB/CPU/queue để định vị bottleneck.',commandId:'panel-probes',aliases:[],context:'panel'},
  ],
})
addBatchCase({
  id:'VPS-08-006',skill:'dns-ipv6-aaaa',objective:'Tách A/AAAA DNS khỏi cấp phát IPv6 và reachability; sửa lỗi annotation trong source Guided.',
  p1:{doc:'dig-a',purpose:'A record từ resolver client',meaning:'A record trỏ 198.51.100.20; không chứng minh IPv6 hoạt động.',context:'client'},p2:{doc:'dig-a',purpose:'AAAA record từ resolver client',meaning:'AAAA trỏ 2001:db8:bad::20; cần đối chiếu IPv6 cấp phát.',context:'client'},
  p2Override:'2001:db8:bad::20',
  symptom:'IPv4 tới site được nhưng IPv6 client thất bại.',redHerring:'Chỉ xảy ra Permission denied khi SSH.',finding:'AAAA tồn tại nhưng panel không cấp IPv6 cho VPS này; record không khớp allocation, cần kiểm tra authority/owner.',overclaim:'IPv4 A record sai vì IPv6 không dùng được.',
  safeNext:'Xác nhận authoritative zone và quyền domain; owner sửa/xóa AAAA không dùng hoặc triển khai IPv6 đúng quy trình.',unsafe:'Tự đổi firewall IPv6 của VPS khách hoặc đoán địa chỉ khác.',verify:'DNS authoritative và validating resolver trả AAAA đúng nếu có IPv6; client IPv6 tải site hoặc không còn AAAA lỗi.',wrongChecks:['df -h /','systemctl restart nginx'],
  extras:[
    {command:'PANEL: IPv6 allocation',output:'Assigned IPv6 addresses: none',purpose:'Đối chiếu cấp phát IPv6 của VPS.',meaning:'VPS này không có IPv6 được cấp ở panel; AAAA cần chủ zone xác minh.',commandId:'panel-ip-allocation',aliases:[],context:'panel'},
    {command:'dig @ns1.example.com example.com AAAA +short',output:'2001:db8:bad::20',purpose:'Hỏi authoritative nameserver về AAAA.',meaning:'Authoritative zone cũng có AAAA này; không phải chỉ cache ở một resolver.',commandId:'dig-a',aliases:[],context:'client'},
  ],
})
addBatchCase({
  id:'VPS-08-008',skill:'dnssec-validation',objective:'Phân biệt SERVFAIL có/không kiểm tra DNSSEC, thu DS/DNSKEY/RRSIG trước khi sửa delegation.',
  p1:{doc:'dig-a',purpose:'A query qua validating resolver',meaning:'Resolver trả SERVFAIL; chưa chỉ ra thành phần DNSSEC hỏng.',context:'client'},p2:{doc:'dig-a',purpose:'Cùng query khi bật checking disabled',meaning:'Với +cd query trả NOERROR; phù hợp giả thuyết lỗi validation, chưa xác định DS hay RRSIG.',context:'client'},
  symptom:'Một số resolver SERVFAIL, resolver khác trả IP.',redHerring:'Website luôn trả 502 từ Nginx local.',finding:'SERVFAIL khi validation và NOERROR với +cd gợi lỗi DNSSEC; cần DS/DNSKEY/RRSIG, thời gian và nhiều resolver.',overclaim:'Chắc chắn DS ở registrar sai và có thể xóa ngay.',
  safeNext:'Thu DS ở parent, DNSKEY/RRSIG authoritative và kết quả nhiều validator; chuyển DNS owner/provider theo change có rollback.',unsafe:'Xóa DS hoặc tắt DNSSEC ngay mà chưa xác minh chain và quyền.',verify:'Validating resolvers trả bản ghi đúng, DNSSEC chain hợp lệ sau TTL và client tải site.',wrongChecks:['df -h /','systemctl status sshd'],
  extras:[
    {command:'dig @9.9.9.9 signed.example.test A +dnssec',output:';; ->>HEADER<<- opcode: QUERY, status: SERVFAIL, id: 19821\n;; flags: qr rd ra; QUERY: 1, ANSWER: 0',purpose:'So resolver validating khác.',meaning:'SERVFAIL lặp lại ở validator khác; chưa định vị mắt xích hỏng.',commandId:'dig-a',aliases:[],context:'client'},
    {command:'dig @ns1.signed.example.test signed.example.test DNSKEY +dnssec',output:';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 21044\n;; ANSWER SECTION:\nsigned.example.test. 3600 IN DNSKEY 257 3 13 AwEAAa... ',purpose:'Kiểm tra authoritative DNSKEY hiện có.',meaning:'Zone công bố DNSKEY; cần đối chiếu DS ở parent và RRSIG, không suy từ một key.',commandId:'dig-ns',aliases:[],context:'client'},
  ],
})
// Batch 4: VM lifecycle and virtualization. Panel/host observations are
// intentionally separate from guest commands and never imply permission to act.
addBatchCase({id:'VPS-06-001',skill:'vm-power-state',objective:'Đối chiếu power state với lịch sử thao tác và quyền bật VPS.',
 p1:{doc:'virsh-dominfo',purpose:'power state ở panel',meaning:'Panel ghi Powered Off; chưa biết vì lỗi hay thao tác có chủ đích.',context:'panel'},p2:{doc:'panel-probes',purpose:'sự kiện shutdown trong panel',meaning:'Event log ghi yêu cầu shutdown lúc 12:30; cần xác nhận người yêu cầu.',context:'panel'},
 symptom:'VPS không phản hồi từ mạng.',redHerring:'Chỉ HTTP trả 403 còn SSH bình thường.',finding:'VM đang off và panel có sự kiện user requested shutdown; chưa thể gọi là lỗi host.',overclaim:'Sự kiện này chứng minh provider tự ý tắt VM.',safeNext:'Đối chiếu audit actor và xác nhận owner muốn bật lại; chỉ chuyển yêu cầu start qua panel có quyền.',unsafe:'Tự bật hoặc reinstall VPS khi chưa xác minh owner.',verify:'Panel báo Running, guest boot xong và dịch vụ khách cần dùng phản hồi.',wrongChecks:['dig example.com A','df -h /'],
 extras:[{command:'PANEL: shutdown audit',output:'12:30 UTC action=shutdown actor=account-owner request_id=act-731',purpose:'Xác minh actor của yêu cầu.',meaning:'Audit gắn thao tác với tài khoản owner; vẫn cần xác nhận ý muốn khởi động lại.',commandId:'panel-probes',aliases:[],context:'panel'}],outputPrompt:'Power state và audit hiện chứng minh điều gì?',decisionPrompt:'Khách muốn bật lại sau shutdown. Bước nào đúng quyền?'})
addBatchCase({id:'VPS-06-002',skill:'reboot-risk',objective:'Điều tra VPS chậm trước yêu cầu reboot, giữ backup job và dữ liệu.',
 p1:{doc:'virsh-dominfo',purpose:'VM state ở panel',meaning:'VM Running; panel không đo chất lượng ứng dụng.',context:'panel'},p2:{doc:'top',purpose:'process dùng CPU trong guest',meaning:'Backup database đang dùng CPU cao tại snapshot; cần xem job và latency.'},
 p2Override:'top - 02:11:02 up 4 days, 2:14, 1 user, load average: 2.89, 2.11, 1.40\n%Cpu(s): 96.2 us, 2.0 sy, 1.8 id\n  PID USER      %CPU COMMAND\n 2418 mysql      94.7 mariabackup',
 symptom:'VPS chậm và khách yêu cầu reboot ngay.',redHerring:'VPS Powered Off từ tối qua.',finding:'VM đang chạy, backup DB dùng CPU nhiều; chưa chứng minh job bất thường hay cần reboot.',overclaim:'CPU cao trong backup chứng minh dữ liệu bị hỏng.',safeNext:'Đo latency/tải và trạng thái backup, trao đổi owner về cửa sổ job; chỉ bàn change sau đánh giá tác động.',unsafe:'Reboot VPS ngay giữa backup đang chạy.',verify:'Backup hoàn tất/được xử lý theo runbook và hiệu năng khách đo lại ổn.',wrongChecks:['dig example.com A','getent passwd admin'],
 extras:[{command:'PANEL: backup job state',output:'database-backup task running since 02:00 UTC; progress 72%',purpose:'Xác nhận job còn hoạt động.',meaning:'Job chưa xong; reboot có thể làm gián đoạn và ảnh hưởng consistency.',commandId:'panel-backup-status',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-06-003',skill:'credential-recovery',objective:'Phân biệt console accessible với quyền reset root; yêu cầu xác minh sở hữu và recovery được duyệt.',
 p1:{doc:'panel-probes',purpose:'khả năng mở console trong panel',meaning:'Console accessible; không nói mật khẩu root là gì.',context:'panel'},p2:{doc:'os-release',purpose:'OS template được ghi ở panel',meaning:'Panel ghi CentOS Stream 9; cần kiểm tra image thực trước runbook.',context:'panel'},
 symptom:'Khách quên mật khẩu root.',redHerring:'VPS mất volume dữ liệu.',finding:'Có console và template CentOS Stream 9; chưa có bằng chứng hợp lệ để thay credential.',overclaim:'Console mở được nên support có quyền đặt lại mật khẩu ngay.',safeNext:'Xác minh chủ tài khoản/quyền, backup và runbook credential recovery; chuyển đội được ủy quyền.',unsafe:'Gửi mật khẩu mới qua ticket hoặc reset root không xác minh owner.',verify:'Owner đăng nhập được qua kênh an toàn sau recovery và audit ghi thay đổi.',wrongChecks:['df -h /','dig example.com A'],
 extras:[{command:'PANEL: ownership verification',output:'Account identity review: pending',purpose:'Đọc trạng thái xác minh quyền yêu cầu.',meaning:'Chưa thể thực hiện credential change khi review còn pending.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-06-004',skill:'reinstall-data-safety',objective:'Đọc cảnh báo overwrite, backup/RPO và quyền trước yêu cầu đổi OS.',
 p1:{doc:'panel-reinstall-confirmation',purpose:'phạm vi overwrite của reinstall trong panel',meaning:'Reinstall sẽ ghi đè main disk; đây là thay đổi phá hủy dữ liệu.',context:'panel'},p2:{doc:'panel-backup-status',purpose:'restore point gần đây',meaning:'Panel không có backup gần đây; không thể cam kết khôi phục dữ liệu.',context:'panel'},
 symptom:'Khách yêu cầu đổi VPS sang Ubuntu nhưng có dữ liệu quan trọng.',redHerring:'Chỉ cần thay package manager để giữ nguyên disk.',finding:'Reinstall main disk sẽ xóa nội dung hiện có và chưa có backup gần đây; phải dừng trước khi có phương án dữ liệu.',overclaim:'Đổi template OS giữ nguyên toàn bộ /home và database.',safeNext:'Giải thích phạm vi mất dữ liệu, yêu cầu backup được kiểm tra và phê duyệt rõ; chuyển quy trình migration/reinstall.',unsafe:'Bấm reinstall ngay vì khách đã nhắc Ubuntu.',verify:'Sau change được duyệt, OS đúng và dữ liệu được restore/test theo kế hoạch; không chỉ nhìn panel Completed.',wrongChecks:['systemctl status sshd','free -h'],
 extras:[{command:'PANEL: backup integrity check',output:'No verified restore test on record',purpose:'Đọc bằng chứng restore được hay chưa.',meaning:'Danh sách backup trống và chưa có restore test; cần bảo vệ dữ liệu trước reinstall.',commandId:'panel-backup-status',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-06-005',skill:'emergency-fstab',objective:'Tách UUID fstab không khớp, volume missing và boot emergency; không sửa mount mù.',
 p1:{doc:'panel-probes',purpose:'thông báo boot từ console',meaning:'Boot dừng ở mount /data; guest còn truy cập console.',context:'panel'},p2:{doc:'fstab-read',purpose:'fstab entry của /data',meaning:'fstab tham chiếu UUID deadbeef; cần so với block device hiện có.'},
 symptom:'VM Running nhưng console vào emergency mode.',redHerring:'Chỉ Nginx trả 404 sau deploy.',finding:'Mount /data thất bại; fstab UUID không có trong blkid snapshot, nhưng cần xác định volume bị tháo hay UUID đổi.',overclaim:'Chắc chắn chỉ là lỗi gõ fstab và có thể bỏ /data vĩnh viễn.',safeNext:'Đối chiếu volume attachment/UUID, backup và owner; chuyển storage nếu volume thiếu, chỉ sửa fstab theo change có rollback.',unsafe:'Xóa fstab entry hoặc format volume để boot nhanh.',verify:'Sau recovery được duyệt, boot bình thường, /data mount đúng volume và dữ liệu đọc được.',wrongChecks:['dig example.com A','systemctl restart nginx'],
 extras:[{command:'blkid',output:'/dev/vda1: UUID="f2b1-root" TYPE="ext4"\n/dev/vdb1: UUID="cafe1234" TYPE="ext4"',purpose:'Đọc UUID thực của block devices.',meaning:'UUID deadbeef không thấy trong snapshot; cần xác nhận vdb1 có phải volume dữ liệu mong đợi.',commandId:'lsblk',aliases:[]},{command:'PANEL: attached volumes',output:'vm-102: os-disk vda; data-volume vol-72 as vdb',purpose:'Kiểm tra attachment ở panel.',meaning:'Panel ghi vol-72 attached; cần xác minh UUID và nội dung trước khi đổi fstab.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-06-006',skill:'rescue-boot-order',objective:'Phân biệt rescue ISO được gắn với lỗi OS disk; thay boot order cần xác nhận owner.',
 p1:{doc:'panel-probes',purpose:'boot source hiện chọn',meaning:'Panel ghi Rescue ISO mounted; chưa chứng minh OS disk hỏng.',context:'panel'},p2:{doc:'panel-probes',purpose:'boot order ở panel',meaning:'Optical được ưu tiên trước disk; phù hợp boot vào rescue.',context:'panel'},
 symptom:'VM luôn vào rescue mode thay vì OS cài đặt.',redHerring:'Ứng dụng chỉ trả 503 sau deploy.',finding:'ISO rescue đang gắn và optical đứng trước disk; có thể giải thích boot path, cần đối chiếu change history/owner.',overclaim:'Hệ điều hành trên disk chắc chắn đã mất.',safeNext:'Xác nhận rescue có còn được dùng, snapshot/backup và phê duyệt change boot source; chuyển đội ảo hóa thao tác có rollback.',unsafe:'Tự tháo ISO và ép reboot khi chưa biết recovery đang diễn ra.',verify:'Sau change được duyệt, guest boot từ OS disk và dịch vụ/volume khách được kiểm tra.',wrongChecks:['df -i /','dig example.com A'],
 extras:[{command:'PANEL: boot activity',output:'07:40 UTC rescue ISO attached by recovery-team; ticket REC-420 open',purpose:'Xem ai gắn rescue và vì sao.',meaning:'Recovery khác còn mở; cần phối hợp trước khi thay boot order.',commandId:'panel-probes',aliases:[],context:'panel'},{command:'PANEL: OS disk inventory',output:'vm-102 os-disk attached; capacity 40 GiB; health check pending',purpose:'Đọc attachment OS disk.',meaning:'Disk có attachment nhưng health chưa được xác nhận; không cam kết boot thành công.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-06-007',skill:'console-gateway',objective:'Phân biệt web console gateway 502 với VM guest, dùng kênh kiểm tra khác trước escalation.',
 p1:{doc:'virsh-dominfo',purpose:'VM state trong panel',meaning:'Panel ghi Running; không chứng minh console gateway khỏe.',context:'panel'},p2:{doc:'panel-probes',purpose:'lỗi websocket của console gateway',meaning:'Gateway trả 502 khi handshake; chưa cho biết guest có hiển thị trên serial/VNC host hay không.',context:'panel'},
 symptom:'VM Running nhưng web console đen.',redHerring:'SSH xác thực sai mật khẩu.',finding:'Gateway console báo 502; đường web console có lỗi, trạng thái guest vẫn chưa chắc chắn.',overclaim:'Màn hình đen chứng minh kernel guest crash.',safeNext:'Đối chiếu health VM qua host/panel và gateway logs; chuyển đội control-plane, giữ phiên khách đang chạy.',unsafe:'Hard reset VM để chữa UI console.',verify:'Gateway websocket kết nối và console hiển thị; guest/service xác minh riêng.',wrongChecks:['df -h /','dig example.com A'],
 extras:[{command:'PANEL: console gateway health',output:'gateway-c2 status=degraded; websocket 5xx rate=38% at 08:15 UTC',purpose:'Kiểm tra phạm vi gateway.',meaning:'Gateway có lỗi diện rộng; không chứng minh một VM hỏng.',commandId:'panel-probes',aliases:[],context:'panel'},{command:'PANEL: VM heartbeat',output:'vm-102 qemu process heartbeat at 08:16 UTC: present',purpose:'Kiểm tra VM qua kênh khác.',meaning:'QEMU còn heartbeat; guest OS vẫn cần kiểm tra riêng.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-06-008',skill:'stopping-state',objective:'Xử lý VM Stopping lâu với giới hạn ACPI và rủi ro hard stop.',
 p1:{doc:'panel-probes',purpose:'thời gian trạng thái Stopping',meaning:'Panel ghi Stopping 20 phút; cần xác nhận tác vụ còn tiến triển.',context:'panel'},p2:{doc:'panel-probes',purpose:'ACPI shutdown event từ QEMU',meaning:'Host đã gửi ACPI shutdown nhưng guest không phản hồi ở snapshot; chưa xác định process nào treo.',context:'panel'},
 symptom:'Shutdown đã yêu cầu nhưng VM kẹt Stopping 20 phút.',redHerring:'DNS A record vừa đổi.',finding:'ACPI request đã gửi, guest chưa phản hồi; cần host/guest evidence trước quyết định cưỡng bức.',overclaim:'Có thể dùng virsh destroy an toàn vì ACPI đã gửi.',safeNext:'Thu task timeline, disk I/O và console/host logs; chuyển đội ảo hóa với owner về rủi ro dữ liệu.',unsafe:'Tự hard stop/destroy VM đang có dữ liệu chưa flush.',verify:'Đội hạ tầng xác nhận VM state ổn định và filesystem/ứng dụng kiểm tra sau recovery.',wrongChecks:['dig example.com A','getent passwd admin'],
 extras:[{command:'PANEL: host task timeline',output:'12:30:00 shutdown requested\n12:30:03 ACPI event delivered\n12:50:00 guest shutdown completion absent',purpose:'Đối chiếu task và guest response.',meaning:'Task chưa hoàn tất; không nói dữ liệu đã flush.',commandId:'panel-probes',aliases:[],context:'panel'},{command:'PANEL: storage latency',output:'vm-102 vda write latency p95 210 ms at 12:48 UTC; host review pending',purpose:'Kiểm tra tín hiệu I/O ở host.',meaning:'I/O chậm có thể liên quan; cần đội hạ tầng xác nhận và bảo vệ dữ liệu.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-10-001',skill:'hypervisor-vm-off',objective:'Đối chiếu panel và libvirt state sau outage, không suy từ VM off rằng guest disk hỏng.',
 p1:{doc:'virsh-dominfo',purpose:'trạng thái VM ở panel',meaning:'Panel ghi Stopped sau outage.',context:'panel'},p2:{doc:'virsh-dominfo',purpose:'domstate từ libvirt host',meaning:'Host trả shut off; panel và host cùng thấy VM off.',context:'hypervisor'},
 symptom:'Panel báo VPS không chạy sau outage.',redHerring:'Guest vẫn SSH được từ mọi nguồn.',finding:'VM off theo panel và host; nguyên nhân dừng và an toàn khởi động lại còn cần incident review.',overclaim:'Dữ liệu guest chắc chắn hỏng vì host từng outage.',safeNext:'Kiểm tra host incident/storage, owner và quyền; đề xuất start có kiểm soát qua đội ảo hóa.',unsafe:'Bật VM liên tục hoặc rollback snapshot không có kế hoạch.',verify:'VM Running, guest boot xong, volume và dịch vụ khách hoạt động.',wrongChecks:['dig example.com A','systemctl status sshd'],
 extras:[{command:'PANEL: outage incident',output:'Node outage INC-410; storage consistency review pending',purpose:'Đọc trạng thái incident node.',meaning:'Chưa xác nhận storage an toàn để start; cần đội hạ tầng.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-10-002',skill:'missing-vnic',objective:'Phân biệt loopback-only trong guest với vNIC attachment ở hypervisor.',
 p1:{doc:'ip-link',purpose:'network links trong guest',meaning:'Snapshot chỉ có lo; guest không thấy NIC khác.'},p2:{doc:'virsh-domiflist',purpose:'vNIC attachment ở panel',meaning:'Panel không liệt kê vNIC; cần kiểm tra config host/migration.',context:'panel'},
 symptom:'VM boot sau migration nhưng chỉ có loopback.',redHerring:'Chỉ SMTP outbound bị policy chặn.',finding:'Guest thiếu NIC và panel không gắn vNIC; khả năng lỗi attachment, phải chuyển đội ảo hóa.',overclaim:'Chắc chắn NetworkManager trong guest lỗi.',safeNext:'Đối chiếu expected NIC/MAC/bridge từ inventory; chuyển host team gắn lại theo change được duyệt.',unsafe:'Tự tạo interface/bridge trong guest để thay NIC ảo.',verify:'Guest thấy đúng NIC/MAC, IP/route và kết nối từ client hoạt động.',wrongChecks:['free -h','df -h /'],
 extras:[{command:'PANEL: expected vNIC',output:'vm-102 expected NIC count=1; MAC=52:54:00:ab:10:02; network=br-public',purpose:'Đối chiếu desired inventory.',meaning:'Desired state có NIC; current panel rỗng, cần host team sửa attachment.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-10-003',skill:'wrong-bridge',objective:'Đối chiếu bridge thực với inventory, không sửa host networking từ guest.',
 p1:{doc:'virsh-domiflist',purpose:'bridge của VM trên libvirt host',meaning:'vnet4 đang gắn br-storage; cần so network được cấp.',context:'hypervisor'},p2:{doc:'panel-probes',purpose:'expected bridge trong panel',meaning:'Inventory ghi br-public cho VM này.',context:'panel'},
 symptom:'VM có IP nhưng không tới gateway được cấp.',redHerring:'Ứng dụng từ chối mật khẩu DB.',finding:'Attachment host đang ở br-storage khác br-public theo inventory; cần xác nhận mapping và change.',overclaim:'Đã chứng minh firewall guest chặn gateway.',safeNext:'Thu MAC, network ID, gateway và host bridge config; chuyển hạ tầng mạng/ảo hóa sửa theo change có console.',unsafe:'Tự đổi bridge VM đang chạy hoặc đổi IP guest ngẫu nhiên.',verify:'Đúng bridge/MAC, guest ARP/ping gateway và kết nối ngoài theo phân bổ.',wrongChecks:['df -i /','systemctl status nginx'],
 extras:[{command:'PANEL: network allocation',output:'vm-102 network=public-vlan-12; bridge=br-public; gateway=198.51.100.1',purpose:'Xác minh bridge/gateway được cấp.',meaning:'Inventory nhất quán với br-public; host attachment cần được đội có quyền kiểm tra.',commandId:'panel-ip-allocation',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-10-004',skill:'host-cpu-contention',objective:'Đọc steal time và host saturation, chuyển đúng đội khi thiếu quyền hypervisor.',
 p1:{doc:'top',purpose:'CPU steal trong guest',meaning:'Guest snapshot có 60% steal; cần trend và ảnh hưởng ứng dụng.'},p2:{doc:'panel-probes',purpose:'host CPU saturation alert',meaning:'Panel báo node saturated; cần xác minh thời gian và phạm vi.',context:'panel'},
 symptom:'VM chậm dù process trong guest idle.',redHerring:'Guest bị hết inode.',finding:'Steal cao cùng host saturation; phù hợp contention ở hypervisor nhưng chưa định danh nguồn.',overclaim:'Có thể tự migrate VM ngay vì host alert.',safeNext:'Thu trend st/latency và node metrics; mở incident hạ tầng, phối hợp lịch capacity.',unsafe:'Tự kill VM khác hoặc hard migrate khi không có quyền.',verify:'Steal time giảm, latency khách bình thường và node metrics ổn.',wrongChecks:['df -i /','dig example.com A'],
 extras:[{command:'PANEL: affected VMs',output:'node-4: 5 VMs report elevated CPU ready 09:00-09:20 UTC',purpose:'Định phạm vi node.',meaning:'Nhiều VM bị ảnh hưởng; cần đội hạ tầng đánh giá capacity.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-10-005',skill:'detached-data-volume',objective:'Tách guest lsblk khỏi domblklist host và bảo vệ volume trước reattach.',
 p1:{doc:'lsblk',purpose:'block devices nhìn từ guest',meaning:'Guest chỉ thấy vda, chưa thấy vdb.'},p2:{doc:'virsh-domblklist',purpose:'block attachment ở host',meaning:'Host domblklist không có vdb; chưa biết data volume đang ở đâu.',context:'hypervisor'},
 p2Override:'Target   Source\n------------------------------------------------\nvda      /var/lib/libvirt/images/os.qcow2',
 symptom:'App volume biến mất sau migration.',redHerring:'Website chỉ sai chứng chỉ.',finding:'vdb vắng ở cả guest và domblklist; cần inventory volume và storage incident.',overclaim:'Volume chắc chắn bị xóa vĩnh viễn.',safeNext:'Dừng ghi vào path có thể thay thế, đối chiếu volume ID/snapshot và chuyển đội storage/virtualization reattach có kiểm soát.',unsafe:'Tạo filesystem mới ở path /data để app chạy lại.',verify:'Đúng volume ID gắn lại, filesystem mount đúng và dữ liệu ứng dụng kiểm tra integrity.',wrongChecks:['dig example.com A','systemctl restart nginx'],
 extras:[{command:'PANEL: data volume inventory',output:'vol-72 status=available; last attached vm-102 before migration; integrity review pending',purpose:'Xác định volume ID và tình trạng.',meaning:'Volume còn trong inventory, nhưng integrity chưa được xác minh.',commandId:'panel-probes',aliases:[],context:'panel'},{command:'PANEL: migration storage task',output:'08:00 migration completed with warning: optional disk vol-72 attach skipped',purpose:'Đối chiếu thời điểm lỗi attachment.',meaning:'Task có warning phù hợp, cần host team khôi phục attachment đúng ID.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-10-006',skill:'snapshot-rollback-rpo',objective:'Đánh giá mốc dữ liệu sau snapshot restore, không ghi đè bản hiện tại trước khi xác định RPO.',
 p1:{doc:'panel-probes',purpose:'snapshot restore activity',meaning:'Panel ghi restore hoàn tất lúc 10:14; chưa cho biết snapshot tạo lúc nào.',context:'panel'},p2:{doc:'stat-file',purpose:'mtime của data.db',meaning:'File có mtime cũ hơn kỳ vọng; mtime riêng không chứng minh toàn bộ dữ liệu đã mất.'},
 p2Override:'  File: /srv/app/data.db\n  Size: 16384\tBlocks: 32\tIO Block: 4096 regular file\nModify: 2026-10-18 00:00:00.000000000 +0000',
 symptom:'Dữ liệu có vẻ cũ sau khi admin restore snapshot.',redHerring:'Chỉ DNS propagation chậm.',finding:'Có restore và file mtime trước kỳ vọng; cần xác minh snapshot timestamp và giao dịch thiếu.',overclaim:'Khôi phục snapshot lần nữa sẽ tự tìm lại dữ liệu mới.',safeNext:'Bảo toàn trạng thái hiện tại, thu snapshot/backup timeline và đối chiếu order log; chuyển data recovery với owner về RPO.',unsafe:'Ghi đè hiện trạng hoặc rollback lần nữa mà chưa sao lưu.',verify:'Owner đối chiếu bản ghi theo mốc, integrity test và RPO được báo rõ.',wrongChecks:['ip route','free -h'],
 extras:[{command:'PANEL: restored snapshot metadata',output:'snapshot snap-104 created=2026-10-18 00:00 UTC; restore completed=2026-10-22 10:14 UTC',purpose:'Tách thời điểm tạo snapshot khỏi thời điểm restore.',meaning:'Snapshot cũ bốn ngày; giao dịch sau đó có thể không nằm trong bản restore.',commandId:'panel-backup-status',aliases:[],context:'panel'},{command:'PANEL: newer backup inventory',output:'2026-10-21 00:00 UTC backup present; restore verification=not run',purpose:'Tìm nguồn dữ liệu mới hơn.',meaning:'Backup mới hơn có trong inventory nhưng chưa chứng minh restore được.',commandId:'panel-backup-status',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-10-007',skill:'migration-network-flap',objective:'Tương quan migration với loss, điều tra vNIC/bridge/ARP và giới hạn quyền.',
 p1:{doc:'panel-probes',purpose:'cửa sổ live migration',meaning:'Task chạy 08:00:00–08:00:36; cần đối chiếu network.',context:'panel'},p2:{doc:'panel-probes',purpose:'cửa sổ packet loss',meaning:'Monitor thấy loss 08:00:04–08:00:35, trùng migration.',context:'panel'},
 symptom:'Kết nối rớt khoảng 30 giây khi VM migration.',redHerring:'API chậm đều 24 giờ dù không migration.',finding:'Loss trùng gần toàn bộ migration; nghi đường chuyển vNIC/bridge, chưa xác định cơ chế host.',overclaim:'Chắc chắn ARP cache trên một switch cụ thể bị sai.',safeNext:'Thu source/destination host, bridge/vNIC, ARP và capture có giới hạn; chuyển network/virtualization, tạm hoãn migration thêm theo policy.',unsafe:'Tự đổi bridge hoặc tắt firewall guest để thử.',verify:'Migration thử được duyệt không gây loss vượt SLA và client TCP giữ ổn định.',wrongChecks:['df -h /','getent passwd admin'],
 extras:[{command:'PANEL: migration hosts',output:'source=node-4 destination=node-7; network=public-vlan-12; vNIC=52:54:00:ab:10:02',purpose:'Lấy cặp host và vNIC.',meaning:'Đủ context để đội mạng tra bridge/ARP; chưa tự chứng minh lỗi.',commandId:'panel-probes',aliases:[],context:'panel'},{command:'PANEL: migration warning',output:'08:00:05 UTC destination bridge learning delay 29 s',purpose:'Đọc warning network của task.',meaning:'Warning phù hợp loss; đội hạ tầng phải xác minh switch/bridge trước thay đổi.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-10-008',skill:'guest-clock-sync',objective:'Phân biệt host clock đúng với guest NTP chưa đồng bộ, kiểm tra timezone và nguồn thời gian.',
 p1:{doc:'timedatectl',purpose:'trạng thái sync/NTP trong guest',meaning:'Guest chưa synchronized và NTP inactive; cần biết service/time source.'},p2:{doc:'date-utc',purpose:'UTC guest so với host',meaning:'Guest chậm khoảng một ngày trong fixture; cert validation có thể thất bại.'},
 p1Override:'               Local time: Wed 2026-10-21 01:00:00 UTC\n           Universal time: Wed 2026-10-21 01:00:00 UTC\nSystem clock synchronized: no\n              NTP service: inactive',p2Override:'Wed Oct 21 01:00:00 UTC 2026',
 symptom:'TLS trong VM lỗi dù host có giờ đúng.',redHerring:'Guest báo ENOSPC khi ghi file.',finding:'Guest time sai đáng kể và NTP inactive; đây là giả thuyết mạnh cho TLS failure, cần thử cert chain sau đồng bộ.',overclaim:'Host clock đúng nên guest tự đồng bộ chắc chắn.',safeNext:'Kiểm tra chrony/timesyncd và nguồn NTP theo OS, change có duyệt để đồng bộ; kiểm tra service nhạy thời gian.',unsafe:'Tự sửa tay date trên production rồi đóng ticket.',verify:'timedatectl synchronized, UTC đúng, TLS chain/hostname kiểm tra lại từ guest.',wrongChecks:['df -h /','ip route'],
 extras:[{command:'cat /etc/os-release',output:'ID=ubuntu\nVERSION_ID="24.04"',purpose:'Xác định OS để chọn service sync.',meaning:'Ubuntu image; kiểm tra systemd-timesyncd hoặc chrony theo cấu hình thực.',commandId:'os-release',aliases:[]},{command:'systemctl status systemd-timesyncd',output:'● systemd-timesyncd.service - Network Time Synchronization\n   Active: inactive (dead)',purpose:'Đọc service sync trên Ubuntu guest.',meaning:'Service inactive; chưa biết có chrony thay thế hay NTP reachability.',commandId:'systemctl-service',aliases:[]}]})
// Batch 5: security and containers. Security signals never authorize an
// unban, SELinux disablement, credential change or destructive Docker action.
addBatchCase({id:'VPS-09-001',skill:'ssh-auth-noise',objective:'Phân biệt failed login scan với đăng nhập thành công và khả năng compromise.',
 p1:{doc:'journalctl-unit',purpose:'failed SSH authentication events',meaning:'Có failed password cho invalid user admin từ IP nguồn; chưa thấy login thành công.'},p2:{doc:'last-logins',purpose:'recent successful login sessions',meaning:'Các phiên được liệt kê thuộc user/IP đã biết; last không phải bằng chứng forensic đầy đủ.'},
 p1Override:'Oct 22 08:22:09 vps sshd[1240]: Failed password for invalid user admin from 198.51.100.55 port 51002 ssh2',
 p2Override:'ops      pts/0        198.51.100.12    Thu Oct 22 08:14   still logged in\nops      pts/1        198.51.100.12    Wed Oct 21 16:02 - 16:30',
 symptom:'Nhiều Failed password trong SSH log.',redHerring:'Đã thấy Accepted publickey root từ IP lạ.',finding:'Đang có failed login từ invalid user; snapshot last không thấy phiên lạ, chưa kết luận máy an toàn tuyệt đối.',overclaim:'Hàng trăm lần fail tự chứng minh kẻ tấn công đã vào được.',safeNext:'Thu source/time, rà Accepted events, key/account changes và policy; chuyển security nếu có dấu hiệu thành công.',unsafe:'Tự block dải IP rộng hoặc tắt SSH để hết log.',verify:'Không có access trái phép trong log/audit được đối chiếu, monitoring và biện pháp approved hoạt động.',wrongChecks:['df -h /','dig example.com A'],
 extras:[{command:'journalctl -u sshd --since "2026-10-22 00:00:00" --no-pager',output:'Oct 22 08:22:09 vps sshd[1240]: Failed password for invalid user admin from 198.51.100.55 port 51002 ssh2\nOct 22 08:22:10 vps sshd[1240]: Connection closed by invalid user admin 198.51.100.55 port 51002 [preauth]',purpose:'Đối chiếu failed event và giai đoạn preauth.',meaning:'Các dòng này không cho thấy xác thực thành công; cần tìm Accepted/audit khác.',commandId:'journalctl-unit',aliases:[]}]})
addBatchCase({id:'VPS-09-002',skill:'fail2ban-source-scope',objective:'Xác nhận đúng source IP và lý do ban trước yêu cầu hỗ trợ office SSH.',
 p1:{doc:'fail2ban-status',purpose:'IP bị ban trong sshd jail',meaning:'Jail liệt kê 198.51.100.60; cần xác minh đây có phải IP office hiện tại.'},p2:{doc:'fail2ban-log',purpose:'sự kiện ban gần đây',meaning:'Log có ban IP .60; chưa cho biết chính sách unban được phép.'},
 p2Override:'2026-10-22 09:12:30,411 fail2ban.actions [902]: NOTICE [sshd] Ban 198.51.100.60',
 symptom:'Office không SSH được nhưng mobile được.',redHerring:'Mọi nguồn đều bị TCP connection refused.',finding:'Office public IP khớp banned IP và có failed attempts; reachability theo nguồn phù hợp Fail2ban.',overclaim:'IP là trusted nên có thể unban vĩnh viễn mà không điều tra.',safeNext:'Xác nhận IP office qua kênh tin cậy, auth failures và policy; đề xuất unban có duyệt, sửa credential/client trước.',unsafe:'Tự tắt Fail2ban hoặc whitelist cả subnet office.',verify:'Office SSH lại bằng tài khoản hợp lệ, jail/policy còn hoạt động và không tái ban bất thường.',wrongChecks:['df -h /','dig example.com A'],
 extras:[{command:'PANEL: office egress IP',output:'Verified office egress IP: 198.51.100.60',purpose:'Đối chiếu IP khách đang dùng.',meaning:'IP khớp ban list; cần kiểm tra vì sao bị ban trước thay đổi.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-09-003',skill:'selinux-httpd-connect',objective:'Đọc AVC name_connect và port đích để xác định policy/context thay vì tắt SELinux.',
 p1:{doc:'getenforce',purpose:'SELinux enforcement mode',meaning:'Enforcing đang bật; riêng mode không chứng minh nó chặn request.'},p2:{doc:'ausearch-avc',purpose:'AVC của httpd tới TCP/9000',meaning:'AVC denied name_connect cho httpd tới port 9000; cần xác minh backend và policy cụ thể.'},
 p2Override:'type=AVC msg=audit(1792670400.101:112): avc:  denied  { name_connect } for  pid=901 comm="httpd" dest=9000 scontext=system_u:system_r:httpd_t:s0 tcontext=system_u:object_r:unreserved_port_t:s0 tclass=tcp_socket permissive=0',
 symptom:'App chỉ hoạt động khi SELinux bị tắt.',redHerring:'DNS authoritative trả NXDOMAIN.',finding:'AVC cho httpd tới TCP/9000 khi Enforcing; đây là bằng chứng policy chặn connect, cần xem route/backend và chính sách cho phép.',overclaim:'Có thể để SELinux permissive vĩnh viễn vì website chạy.',safeNext:'Đối chiếu target port và AVC với admin, chọn boolean/policy hẹp theo runbook được duyệt; kiểm tra lại ở Enforcing.',unsafe:'Chạy setenforce 0 hoặc disable SELinux cho khách.',verify:'Ứng dụng gọi backend được khi Enforcing, không có AVC liên quan và policy audit rõ.',wrongChecks:['df -h /','ip route'],
 extras:[{command:'ss -ltnp | grep :9000',output:'LISTEN 0 128 127.0.0.1:9000 0.0.0.0:* users:(("myapp",pid=902,fd=8))',purpose:'Xác nhận backend local trên TCP/9000.',meaning:'Backend đang nghe local; AVC giải thích một rào cản nhưng không xác minh app end-to-end.',commandId:'ss-ltnp',aliases:[]}]})
addBatchCase({id:'VPS-09-004',skill:'privileged-account-audit',objective:'Điều tra account có sudo ngoài ý muốn, bảo toàn audit trước containment.',
 p1:{doc:'getent-passwd',purpose:'account supportadmin trong identity database',meaning:'Account tồn tại với shell; chưa chứng minh ai tạo hoặc đã đăng nhập.'},p2:{doc:'sudoers-read',purpose:'sudoers grant cho account',meaning:'Drop-in trao sudo cho supportadmin; cần xác nhận approval và nguồn tạo.'},
 p2Override:'/etc/sudoers.d/supportadmin:supportadmin ALL=(ALL) ALL',
 symptom:'Khách thấy account admin không nhận ra.',redHerring:'Web chỉ trả 404 sau deploy.',finding:'Account tồn tại và được cấp sudo, chưa rõ tính hợp lệ; cần audit creation/login.',overclaim:'Tên lạ tự chứng minh compromise và có thể xóa account ngay.',safeNext:'Giữ bằng chứng, xác nhận change record/owner, rà auth và sudo logs; chuyển security để containment được duyệt.',unsafe:'Xóa account ngay làm mất chứng cứ hoặc tự đổi toàn bộ mật khẩu.',verify:'Owner/security xác nhận nguồn account, quyền được xử lý theo incident và không còn access trái phép.',wrongChecks:['df -h /','dig example.com A'],
 extras:[{command:'journalctl _COMM=useradd --since "2026-10-20" --no-pager',output:'Oct 21 04:10:17 vps useradd[2002]: new user: name=supportadmin, UID=1002, GID=1002, home=/home/supportadmin, shell=/bin/bash',purpose:'Tìm thời điểm tạo account.',meaning:'Biết thời điểm tạo nhưng chưa xác định actor/approval; cần audit trail đầy đủ.',commandId:'journal-boot',aliases:[]}]})
addBatchCase({id:'VPS-09-005',skill:'abuse-smtp-triage',objective:'Liên hệ abuse notice với socket/process, giữ bằng chứng và escalation có giới hạn quyền.',
 p1:{doc:'panel-probes',purpose:'abuse notice SMTP của provider',meaning:'Provider báo spike SMTP từ IP VPS; notice chưa chứng minh process nào vi phạm.',context:'panel'},p2:{doc:'ss-connections',purpose:'socket SMTP outbound và PID trong guest',meaning:'Python PID 1802 có kết nối tới TCP/25; cần định danh process/owner và thời gian.'},
 p2Override:'ESTAB 0 0 198.51.100.20:45000 203.0.113.25:25 users:(("python3",pid=1802,fd=9))',
 symptom:'Provider báo spam từ public IP VPS.',redHerring:'Chỉ một client DNS trả NXDOMAIN.',finding:'Notice và socket SMTP outbound cùng IP phù hợp traffic cần điều tra; chưa chứng minh nội dung spam hay compromise.',overclaim:'Python process chắc chắn là malware và có thể xóa ngay.',safeNext:'Bảo toàn notice, socket, process ancestry và mail logs; chuyển abuse/security, phối hợp owner và chính sách containment.',unsafe:'Kill/xóa process, wipe VPS hoặc mở lại mail traffic không điều tra.',verify:'Security xác nhận nguồn traffic, containment được phê duyệt và provider thấy spike dừng.',wrongChecks:['df -i /','systemctl status nginx'],
 extras:[{command:'ps -p 1802 -o pid,ppid,user,comm,args',output:'PID PPID USER COMM ARGS\n1802 1 app python3 /srv/app/mail_worker.py',purpose:'Nhận diện owner và command line của PID.',meaning:'Có vẻ là mail worker ứng dụng; không chứng minh gửi hợp lệ hay độc hại.',commandId:'ps-process',aliases:[]},{command:'PANEL: abuse flow summary',output:'14:00-14:15 UTC outbound TCP/25 connections: 1280; baseline: 20 per 15 min',purpose:'Định lượng spike và thời gian.',meaning:'Spike rõ ràng, cần log ứng dụng và owner giải thích.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-09-006',skill:'ddos-mitigation-scope',objective:'Phân biệt mitigation/null-route upstream với guest firewall và dùng incident escalation.',
 p1:{doc:'panel-probes',purpose:'mitigation event ở panel',meaning:'Mitigation kích hoạt 14:05 cho IP; chưa biết trigger đúng hay false positive.',context:'panel'},p2:{doc:'panel-probes',purpose:'upstream null-route state',meaning:'Upstream đang null-route từ 14:06; guest không thể tự sửa state này.',context:'panel'},
 symptom:'Public IP không phản hồi trong traffic spike.',redHerring:'Chỉ ứng dụng trả lỗi 401.',finding:'Mitigation và null-route trùng thời gian mất kết nối; cần điều tra lưu lượng và policy provider.',overclaim:'Tắt firewall guest sẽ gỡ null-route upstream.',safeNext:'Thu traffic graphs, incident ID, source/time; chuyển network/security để xem mitigation và điều kiện gỡ theo policy.',unsafe:'Tự gỡ null-route hoặc mở firewall toàn bộ để thử.',verify:'Upstream route khôi phục được duyệt, client từ nhiều nguồn tới dịch vụ và monitoring ổn.',wrongChecks:['df -h /','getent passwd admin'],
 extras:[{command:'PANEL: mitigation traffic summary',output:'14:02 UTC inbound pps 2.4M; baseline 18k; mitigation policy ID DDOS-7',purpose:'Đọc mức traffic và policy.',meaning:'Traffic spike có thật trong fixture; chưa kết luận traffic hợp lệ hay attack.',commandId:'panel-probes',aliases:[],context:'panel'},{command:'PANEL: mitigation incident',output:'Incident NET-612 open; network on-call assigned',purpose:'Kiểm tra ownership của xử lý upstream.',meaning:'Đội mạng đã nhận; ticket chưa resolved.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-09-007',skill:'unknown-root-login',objective:'Xử lý Accepted root login từ IP lạ như incident nghiêm trọng nhưng chưa quy kết actor.',
 p1:{doc:'journalctl-unit',purpose:'Accepted root SSH event',meaning:'sshd ghi Accepted publickey cho root từ IP .77; cần kiểm tra fingerprint/key và owner.'},p2:{doc:'last-logins',purpose:'session root trong last',meaning:'last có root session từ cùng IP; củng cố login thành công, không xác định người đứng sau.'},
 p1Override:'Oct 22 09:14:20 vps sshd[3104]: Accepted publickey for root from 203.0.113.77 port 51144 ssh2: ED25519 SHA256:AbCdEf123456',
 p2Override:'root     pts/0        203.0.113.77    Thu Oct 22 09:14   still logged in',
 symptom:'Khách thấy successful root SSH từ IP không nhận ra.',redHerring:'Chỉ có failed password cho user không tồn tại.',finding:'Hai nguồn ghi login root thành công từ .77; tính được phép chưa biết, cần incident/security ngay.',overclaim:'IP lạ chứng minh attacker cụ thể và hệ thống đã sạch sau logout.',safeNext:'Bảo toàn auth/audit, xác minh owner/automation, chuyển security để containment, key rotation và forensic có duyệt.',unsafe:'Xóa log, reboot hoặc khóa root ngay khi chưa có containment plan.',verify:'Security xác nhận phạm vi, access trái phép bị chặn theo change, key/audit được kiểm tra và monitoring sạch.',wrongChecks:['df -h /','dig example.com A'],
 extras:[{command:'journalctl -u sshd --since "2026-10-22 00:00:00" --no-pager',output:'Oct 22 09:14:20 vps sshd[3104]: Accepted publickey for root from 203.0.113.77 port 51144 ssh2: ED25519 SHA256:AbCdEf123456',purpose:'Lấy timestamp và fingerprint key từ auth log.',meaning:'Có key fingerprint để đối chiếu inventory; không tiết lộ private key.',commandId:'journalctl-unit',aliases:[]},{command:'PANEL: approved access inventory',output:'Approved root SSH source IPs: 198.51.100.12; 203.0.113.77: not listed',purpose:'Đối chiếu IP với allowlist được duyệt.',meaning:'IP không có trong inventory; cần owner/security xác minh thay vì tự kết luận actor.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-09-008',skill:'suspicious-persistence',objective:'Đọc cron persistence và hash mismatch, không tự xóa artifact trước forensic.',
 p1:{doc:'crontab-read',purpose:'root cron entry tái chạy process',meaning:'Cron chạy /usr/local/bin/agent-update mỗi 5 phút; chưa biết hợp lệ hay độc hại.'},p2:{doc:'sha256sum',purpose:'SHA-256 của artifact hiện tại',meaning:'Hash hiện tại cần đối chiếu baseline tin cậy; không tự nói malicious.'},
 p2Override:'6f4a7f06e1241c56084354206463b687cbe92ab26d9d7c9c7e5ed12c2a67a901  /usr/local/bin/agent-update',
 symptom:'Process xuất hiện lại sau khi bị terminate.',redHerring:'Nginx chỉ trả 404 vì root path.',finding:'Root cron tái chạy binary, hash khác baseline trong inventory; nghi unauthorized persistence, cần xác minh change/owner.',overclaim:'Hash khác tự chứng minh malware và xóa file là đủ.',safeNext:'Bảo toàn cron, binary/hash, timeline và process tree; chuyển security để containment/forensic có duyệt.',unsafe:'rm -rf binary/cron hoặc reboot trước khi lưu chứng cứ.',verify:'Security xác định artifact, persistence được xử lý theo plan và monitoring không còn tái xuất hiện.',wrongChecks:['dig example.com A','df -h /'],
 extras:[{command:'PANEL: approved agent hash',output:'agent-update approved SHA-256: dce7824babcc0a9c2a4101d010d6301f0d41666cbfc6a2e698ae1200c674689',purpose:'Lấy baseline tin cậy.',meaning:'Baseline khác hash hiện tại; cần xác nhận version/change record, không tự xóa.',commandId:'panel-probes',aliases:[],context:'panel'},{command:'ps -eo pid,ppid,user,comm,args | grep agent-update',output:'4412 1 root agent-update /usr/local/bin/agent-update',purpose:'Xem process và parent hiện tại.',meaning:'Process đang chạy từ đường dẫn cron; chưa biết tác động hoặc nguồn cài.',commandId:'ps-process',aliases:[]}]})
addBatchCase({id:'VPS-13-001',skill:'container-exit-log',objective:'Đọc container Exited và Python import error trước khi đề xuất deploy fix.',
 p1:{doc:'docker-ps',purpose:'trạng thái api container',meaning:'api Exited (1); chưa biết vì config hay image.'},p2:{doc:'docker-logs',purpose:'lỗi khởi động container',meaning:'ModuleNotFoundError: appconfig cho thấy import thất bại; cần kiểm tra image/manifest.'},
 symptom:'Docker app offline.',redHerring:'VPS Powered Off ở panel.',finding:'api container exit code 1 và log import module appconfig; cần đối chiếu release/dependency.',overclaim:'Docker daemon host chắc chắn hỏng.',safeNext:'Kiểm tra image digest, release manifest và owner; đề xuất redeploy dependency đúng theo change.',unsafe:'Xóa volume rồi chạy lại container.',verify:'Container stable, app endpoint trả đúng và log không còn import error.',wrongChecks:['dig example.com A','ip route'],
 extras:[{command:'PANEL: deployment manifest',output:'api release=v2.0; appconfig package omitted from build manifest',purpose:'Đối chiếu dependency trong artifact.',meaning:'Manifest thiếu package phù hợp log; owner cần sửa build và xác minh.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-13-002',skill:'docker-port-publish',objective:'Phân biệt exposed container port với published host port.',
 p1:{doc:'docker-ps',purpose:'PORTS của web container',meaning:'Chỉ 8080/tcp không có host mapping hiển thị.'},p2:{doc:'docker-port',purpose:'published port mapping',meaning:'Không có stdout mapping trong fixture; cần đối chiếu compose/run config.'},
 p2Override:'',
 symptom:'App trong container hoạt động nhưng VPS IP không vào được.',redHerring:'Backend trả HTTP 500 ngay trong container.',finding:'Container có exposed 8080/tcp nhưng không có published host port; cần kiểm tra thiết kế proxy/network trước change.',overclaim:'Dockerfile EXPOSE 8080 tự mở public port.',safeNext:'Xác nhận yêu cầu public/private và owner; đề xuất publish hoặc reverse proxy có bảo vệ theo change.',unsafe:'Mở 0.0.0.0:8080 và firewall rộng ngay không review.',verify:'Đúng endpoint từ client vào được theo policy, port khác không lộ và app trả nội dung.',wrongChecks:['df -h /','free -h'],
 extras:[{command:'docker inspect web --format "{{json .HostConfig.PortBindings}}"',output:'{}',purpose:'Xác nhận HostConfig không có port binding.',meaning:'Metadata khớp output docker port rỗng; chưa biết app listener và intended exposure.',commandId:'docker-inspect',aliases:[]}]})
addBatchCase({id:'VPS-13-003',skill:'docker-loopback-bind',objective:'Đọc host bind 127.0.0.1 và xác định phạm vi public exposure trước change.',
 p1:{doc:'docker-port',purpose:'host IP/port của published mapping',meaning:'Port 8080 chỉ bind 127.0.0.1 trên host.'},p2:{doc:'curl-head',purpose:'HTTP local qua host mapping',meaning:'Localhost trả HTTP 200; không chứng minh truy cập ngoài.'},
 p2Override:'HTTP/1.1 200 OK\nContent-Type: text/html',
 symptom:'App ở localhost chạy, client ngoài không tới.',redHerring:'Container đã Exited (1).',finding:'Host mapping chỉ trên loopback; cần xác nhận intended exposure và reverse proxy trước đổi.',overclaim:'Mở firewall là đủ dù socket chỉ bind loopback.',safeNext:'Xác nhận architecture/authorization; dùng proxy hoặc publish đúng interface kèm ACL/TLS theo change.',unsafe:'Tự expose container ra Internet không review.',verify:'Client được phép tới app qua đúng endpoint, các nguồn khác vẫn theo policy.',wrongChecks:['df -i /','dig example.com A'],
 extras:[{command:'ss -ltnp | grep :8080',output:'LISTEN 0 4096 127.0.0.1:8080 0.0.0.0:* users:(("docker-proxy",pid=2011,fd=4))',purpose:'Đối chiếu listener trên host.',meaning:'Listener loopback xác nhận scope; firewall ngoài không tạo public bind.',commandId:'ss-ltnp',aliases:[]}]})
addBatchCase({id:'VPS-13-004',skill:'container-oom-limit',objective:'Đọc OOMKilled cùng memory limit, không tăng limit mù.',
 p1:{doc:'docker-inspect',purpose:'OOMKilled flag của api',meaning:'Container bị OOM kill ở lần exit gần đây.'},p2:{doc:'docker-stats',purpose:'memory usage/limit snapshot',meaning:'498 MiB gần limit 512 MiB; cần xem tải, memory trend và host capacity.'},
 p2Override:'CONTAINER ID   NAME   CPU %   MEM USAGE / LIMIT     MEM %\na4c21d02f881   api    44.2%   498MiB / 512MiB       97.27%',
 symptom:'Container restart ở peak traffic.',redHerring:'Chỉ DNS trong host lỗi.',finding:'OOMKilled true và memory gần 512 MiB; nguyên nhân cấp phát/tải/leak chưa được định vị.',overclaim:'Chỉ tăng limit lên 8 GiB chắc chắn giải quyết.',safeNext:'Đo trend, request và host headroom; owner chỉnh workload/limit trong change có rollback.',unsafe:'Tắt memory limit và restart container ngay ở peak.',verify:'Qua peak representative container không OOM, memory có headroom và API ổn.',wrongChecks:['dig example.com A','ip route'],
 extras:[{command:'docker inspect api --format "{{.HostConfig.Memory}}"',output:'536870912',purpose:'Xác nhận memory limit byte từ config.',meaning:'536870912 byte = 512 MiB; cần so host capacity và workload.',commandId:'docker-inspect',aliases:[]}]})
addBatchCase({id:'VPS-13-005',skill:'container-dns-scope',objective:'Tách DNS trong container khỏi host resolver và network reachability.',
 p1:{doc:'getent-hosts',purpose:'name lookup trong api container',meaning:'Không có stdout cho lookup; chưa có exit status, cần thêm DNS query.',context:'guest'},p2:{doc:'getent-hosts',purpose:'name lookup từ host',meaning:'Host trả IP cho hostname; lỗi có thể riêng container.'},
 p1Override:'',
 symptom:'Container không resolve domain còn host resolve được.',redHerring:'Container không có default route và mọi IP đều unreachable.',finding:'Host có name lookup, container query DNS bổ sung timeout; scope ở container resolver/network path.',overclaim:'Public DNS authoritative chắc chắn không có A record.',safeNext:'Đọc /etc/resolv.conf của container, Docker network và DNS reachability; owner/infra sửa cấu hình có quyền.',unsafe:'Tự thay DNS toàn bộ host và restart mọi container.',verify:'Container resolve domain qua resolver được cấp và app kết nối endpoint, host vẫn bình thường.',wrongChecks:['df -h /','systemctl status nginx'],
 extras:[{command:'docker exec api cat /etc/resolv.conf',output:'nameserver 127.0.0.11\noptions ndots:0',purpose:'Đọc DNS resolver trong container.',meaning:'Docker embedded DNS được cấu hình; chưa chứng minh upstream hoạt động.',commandId:'docker-exec-read',aliases:[]},{command:'docker exec api nslookup example.com',output:';; communications error to 127.0.0.11#53: timed out\n;; no servers could be reached',purpose:'Kiểm tra DNS query thực từ container.',meaning:'Query tới embedded DNS timeout; cần Docker daemon/network logs, không quy lỗi public zone.',commandId:'docker-exec-read',aliases:[]}]})
addBatchCase({id:'VPS-13-006',skill:'container-forwarding',objective:'Đọc container route với host forwarding off; không tự thay sysctl/firewall VPS.',
 p1:{doc:'ip-route',purpose:'default route trong container',meaning:'Container có route qua 172.17.0.1; chưa chứng minh host forward/NAT.'},p2:{doc:'sysctl-read',purpose:'IPv4 forwarding trên host',meaning:'net.ipv4.ip_forward=0 trên host; là rào cản forwarding cần đối chiếu policy.'},
 symptom:'Container tới host được nhưng không tới Internet.',redHerring:'App chỉ sai mật khẩu database.',finding:'Route container có, host IPv4 forwarding off; đây là một nguyên nhân khả dĩ, cần kiểm tra NAT/policy trước change.',overclaim:'Bật ip_forward=1 sẽ tự sửa mọi vấn đề NAT/firewall.',safeNext:'Kiểm tra Docker bridge/NAT và host security policy; chuyển admin được ủy quyền lập change/rollback.',unsafe:'Tự bật forwarding và mở firewall toàn bộ.',verify:'Container tới đích IP và DNS theo policy; host firewall/NAT vẫn đúng.',wrongChecks:['df -h /','getent passwd admin'],
 extras:[{command:'docker network inspect bridge --format "{{json .IPAM.Config}}"',output:'[{"Subnet":"172.17.0.0/16","Gateway":"172.17.0.1"}]',purpose:'Đối chiếu gateway bridge.',meaning:'Route container trỏ bridge gateway hợp lệ; vẫn cần forwarding/NAT ở host.',commandId:'docker-inspect',aliases:[]},{command:'PANEL: host network policy',output:'Container egress expected: allowed via Docker bridge; change approval required',purpose:'Đọc expected policy và quyền.',meaning:'Forwarding đang off khác desired policy; admin host cần xử lý.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-13-007',skill:'compose-db-memory',objective:'Không coi api Up là toàn stack khỏe; điều tra db exit và host/container memory.',
 p1:{doc:'docker-compose-ps',purpose:'trạng thái api và db services',meaning:'api Up nhưng db Exited (1); app health không bảo đảm query DB.'},p2:{doc:'docker-compose-logs',purpose:'db startup failure',meaning:'InnoDB báo Cannot allocate memory; cần biết OOM/cgroup/host capacity.'},
 p1Override:'NAME   IMAGE       SERVICE   STATUS\napi    api:v2.0    api       Up 2 minutes\ndb     mariadb:11  db        Exited (1) 2 minutes ago',
 symptom:'App container healthy nhưng DB query thất bại.',redHerring:'DNS A record của domain sai.',finding:'DB container đã exit với memory allocation failure; cần xác định giới hạn container hay host.',overclaim:'Tăng RAM guest ngay chắc chắn sửa InnoDB.',safeNext:'Thu inspect OOMKilled, memory limit, host available và data volume health; chuyển DB/infra lập recovery an toàn.',unsafe:'Xóa DB volume hoặc restart loop không kiểm tra integrity.',verify:'db stable, query representative thành công, không OOM và dữ liệu integrity được xác nhận.',wrongChecks:['dig example.com A','systemctl status sshd'],
 extras:[{command:'docker inspect db --format "{{.State.OOMKilled}} {{.HostConfig.Memory}}"',output:'true 1073741824',purpose:'Đọc OOM flag và memory limit db.',meaning:'DB từng OOM với limit 1 GiB; cần đối chiếu workload và host headroom.',commandId:'docker-inspect',aliases:[]},{command:'free -h',output:'Mem:  4.0Gi  2.7Gi  400Mi  100Mi  900Mi  700Mi\nSwap: 0B 0B 0B',purpose:'Đọc available memory của host.',meaning:'Host còn available, nhưng container limit riêng vẫn có thể gây OOM.',commandId:'free-h',aliases:[]}]})
addBatchCase({id:'VPS-13-008',skill:'image-regression',objective:'Đối chiếu log với image tag/digest và config compatibility trước rollback.',
 p1:{doc:'docker-logs',purpose:'lỗi startup trong api container',meaning:'Release hiện tại từ chối legacyMode; cần kiểm tra config schema.'},p2:{doc:'panel-probes',purpose:'thay đổi tag trong deployment',meaning:'Tag đổi v1.8→v2.0 gần sự cố; tag không chứng minh exact image digest.',context:'panel'},
 symptom:'Deploy mới làm API lỗi ngay.',redHerring:'VM mất vNIC sau migration.',finding:'Log config option không được nhận cùng thời điểm tag đổi; nghi incompatibility release/config.',overclaim:'Chỉ đổi tag ngược mà không kiểm tra data migration là rollback an toàn.',safeNext:'Xác nhận image digest/changelog và schema/data migration; owner duyệt rollback hoặc sửa config có kế hoạch.',unsafe:'Xóa container/volume và pull latest ngẫu nhiên.',verify:'API health và request đại diện thành công, data integrity và deployment digest được đối chiếu.',wrongChecks:['df -i /','dig example.com A'],
 extras:[{command:'docker inspect api --format "{{.Image}}"',output:'sha256:87a4b2c611de331191237634edcb8656944410b00a2429958d86f7359444250a',purpose:'Ghi digest của image đang chạy.',meaning:'Digest cố định để đối chiếu artifact; không tự nói config nào hợp lệ.',commandId:'docker-inspect',aliases:[]},{command:'PANEL: v2.0 release notes',output:'v2.0 removes legacyMode; data migration status: unknown',purpose:'Đối chiếu compatibility và rollback risk.',meaning:'Config mismatch được hỗ trợ; thiếu dữ liệu migration nên chưa thể rollback mù.',commandId:'panel-probes',aliases:[],context:'panel'}]})
// Batch 6: backups and control panel. A task/list entry is not proof that
// data can be restored or that the guest has converged to panel state.
addBatchCase({id:'VPS-11-001',skill:'backup-target-quota',objective:'Phân biệt backup task failed vì target quota với dung lượng guest.',
 p1:{doc:'panel-backup-task',purpose:'trạng thái backup task',meaning:'Task failed; cần đọc log để biết lý do.',context:'panel'},p2:{doc:'backup-log',purpose:'backup agent/target error',meaning:'Target quota exceeded; chưa có backup mới thành công.',context:'panel'},
 symptom:'Nightly backup không hoàn tất.',redHerring:'VPS không boot vì fstab lỗi.',finding:'Task failed và target quota exceeded; giới hạn nằm ở đích backup, chưa cần xóa dữ liệu guest.',overclaim:'Backup đã an toàn vì task có bản ghi trong panel.',safeNext:'Xác nhận quota/retention và backup hiện có; chuyển đội backup/capacity tăng quota hoặc dọn theo policy được duyệt.',unsafe:'Xóa backup cũ hoặc dữ liệu guest không kiểm tra retention.',verify:'Task mới Completed, artifact có checksum và restore test theo quy trình.',wrongChecks:['df -h /','systemctl status sshd'],
 extras:[{command:'PANEL: backup target usage',output:'Target backup-pool-2: 500 GiB used / 500 GiB quota',purpose:'Xác nhận quota target.',meaning:'Đích đầy; không cho biết backup cũ nào có thể xóa.',commandId:'panel-backup-task',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-11-002',skill:'restore-point-rpo',objective:'So requested time với restore point thật, không hứa khôi phục thời điểm chưa có.',
 p1:{doc:'panel-restore-points',purpose:'restore points đã hoàn tất',meaning:'Mốc gần nhất 2026-10-20 00:00 UTC.' ,context:'panel'},p2:{doc:'panel-restore-points',purpose:'thời điểm khách yêu cầu',meaning:'Khách muốn 2026-10-22 08:00 UTC, trễ hơn restore point gần nhất.',context:'panel'},
 symptom:'Khách muốn restore về sáng nay.',redHerring:'Chỉ cần restart backup-agent là dữ liệu sáng nay hiện ra.',finding:'Không có restore point đúng thời điểm được yêu cầu trong panel; cần tìm nguồn khác trước cam kết.',overclaim:'Có thể restore chính xác 08:00 từ mốc 20/10.',safeNext:'Báo gap RPO, tra backup khác/snapshot/app logs, xác nhận lựa chọn với owner và chuyển backup team.',unsafe:'Restore mốc cũ lên production ngay, ghi đè dữ liệu mới.',verify:'Restore thử trên môi trường riêng, owner xác nhận mốc và dữ liệu trước production change.',wrongChecks:['ip route','free -h'],
 extras:[{command:'PANEL: alternate snapshot inventory',output:'No snapshots between 2026-10-20 00:00 UTC and 2026-10-22 08:00 UTC',purpose:'Tìm nguồn khôi phục khác.',meaning:'Panel này không có mốc gần hơn; chưa loại trừ backup ứng dụng riêng.',commandId:'panel-restore-points',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-11-003',skill:'archive-integrity',objective:'Đọc tar lỗi và hash mismatch, bảo vệ bản backup hiện có.',
 p1:{doc:'tar-list',purpose:'liệt kê archive mà không extract',meaning:'tar báo Unexpected EOF; archive có thể bị cắt, chưa biết bản sao khác.'},p2:{doc:'sha256sum',purpose:'checksum archive so baseline',meaning:'Hash khác checksum lưu; integrity không đạt.'},
 p1Override:'tar: Unexpected EOF in archive\ntar: Error is not recoverable: exiting now',p2Override:'a7849b8bc8a766542a3c06e50ef645ef882126df720bd2661f8d6b8c825aa129  /backup/app.tar',
 symptom:'Backup tồn tại nhưng extract lỗi.',redHerring:'Container không publish port.',finding:'tar không đọc hết archive và hash khác baseline tin cậy; bản này không đủ tin để restore production.',overclaim:'Đổi extension .tar hoặc chạy tar lại sẽ sửa dữ liệu.',safeNext:'Giữ bản lỗi, kiểm tra nguồn copy/transport và backup khác; chuyển backup team tạo/kiểm tra artifact mới.',unsafe:'Xóa bản lỗi hoặc restore đè production để thử.',verify:'Checksum khớp baseline, archive list được và restore thử trên môi trường cách ly.',wrongChecks:['systemctl status nginx','ip route'],
 extras:[{command:'PANEL: stored checksum',output:'app.tar expected SHA-256: 19b597accb1e6e9a9da2de182f1bc2349a16cfba655dc6060948ce541c6b24fe',purpose:'Đọc hash từ nguồn tin cậy.',meaning:'Hash khác local; cần xác minh transfer/source và bản sao khác.',commandId:'panel-backup-status',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-11-004',skill:'snapshot-datastore-capacity',objective:'Phân biệt datastore host với disk guest và escalation capacity.',
 p1:{doc:'panel-backup-task',purpose:'snapshot task result',meaning:'Snapshot task fail vì datastore no space; không tạo restore point mới.',context:'panel'},p2:{doc:'panel-backup-task',purpose:'datastore usage',meaning:'Datastore 99.9% used; cần host storage team điều tra.',context:'panel'},
 symptom:'VM snapshot creation thất bại.',redHerring:'Guest root filesystem còn 1 GiB.',finding:'Snapshot target datastore gần đầy và task thất bại; không suy ra guest disk đầy.',overclaim:'Có thể xóa snapshot cũ của VM khác để giải quyết.',safeNext:'Mở storage/capacity incident, xem retention và active chain trước cleanup hoặc mở rộng.',unsafe:'Xóa snapshot bất kỳ hoặc format datastore.',verify:'Datastore headroom đạt policy, snapshot mới hoàn tất và restore test theo quy trình.',wrongChecks:['df -h /','free -h'],
 extras:[{command:'PANEL: datastore snapshot chain',output:'ds-3: 12 active VM snapshot chains; cleanup approval pending',purpose:'Kiểm tra rủi ro cleanup.',meaning:'Không được xóa snapshot đang phục vụ chain khi chưa có plan.',commandId:'panel-backup-task',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-11-005',skill:'restore-disk-scope',objective:'Đối chiếu disk được restore với inventory và data volume trước reattach.',
 p1:{doc:'panel-backup-task',purpose:'disk list trong restore job',meaning:'Job chỉ include vda; không nói vdb đã bị xóa.',context:'panel'},p2:{doc:'lsblk',purpose:'block devices trong guest restored',meaning:'Guest chỉ thấy vda; data disk hiện không attached.'},
 symptom:'OS boot sau restore nhưng data disk biến mất.',redHerring:'Nginx chỉ thiếu TLS cert.',finding:'Restore job chỉ gồm OS disk và guest không thấy vdb; cần tìm data volume/snapshot riêng.',overclaim:'Restore OS disk đã bao gồm toàn bộ /data.',safeNext:'Bảo vệ guest hiện tại, đối chiếu volume ID, backup scope và owner; chuyển storage reattach/restore đúng disk có duyệt.',unsafe:'Tạo filesystem mới trên tên vdb đoán hoặc restore đè OS lần nữa.',verify:'Đúng data volume gắn/mount, checksum hoặc app integrity và owner xác nhận dữ liệu.',wrongChecks:['dig example.com A','systemctl restart nginx'],
 extras:[{command:'PANEL: data disk backup inventory',output:'vol-72 vdb: separate snapshot 2026-10-20 00:00 UTC; restore test=not run',purpose:'Tìm restore source của data disk.',meaning:'Có snapshot riêng nhưng chưa chứng minh dữ liệu khôi phục được.',commandId:'panel-restore-points',aliases:[],context:'panel'},{command:'PANEL: current volume attachment',output:'vm-102: vda attached; vol-72 status=available, not attached',purpose:'Đối chiếu attachment hiện tại.',meaning:'Volume có trong inventory, cần xác minh ID/integrity trước reattach.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-11-006',skill:'backup-rpo-gap',objective:'Tính gap thời gian backup–incident và phân biệt RPO với dữ liệu mất thực tế.',
 p1:{doc:'panel-restore-points',purpose:'creation time của backup đã restore',meaning:'Backup tạo 20/10 00:00 UTC, không chứa thay đổi sau mốc đó nếu snapshot nhất quán.',context:'panel'},p2:{doc:'panel-restore-points',purpose:'incident time',meaning:'Incident 22/10 12:00 UTC; gap tối đa 60 giờ về thời gian.',context:'panel'},
 symptom:'Khách thiếu đơn hàng hôm qua sau restore.',redHerring:'Chỉ NTP guest chậm vài phút.',finding:'Mốc backup cách incident 60 giờ; các đơn sau 20/10 có thể thiếu, cần app/order log để lượng hóa.',overclaim:'Chắc chắn toàn bộ đơn trong 60 giờ đều mất vĩnh viễn.',safeNext:'Giữ trạng thái restored, tìm DB/binlog/backup mới hơn và đối chiếu order IDs; chuyển data recovery cùng owner.',unsafe:'Restore lặp lại trên production hoặc nhập đơn thủ công không đối chiếu.',verify:'Owner kiểm tra order set/integrity và ghi rõ RPO/data gap còn lại.',wrongChecks:['ip route','systemctl status sshd'],
 extras:[{command:'PANEL: app transaction log inventory',output:'DB binlog archives: 2026-10-20 00:00 to 2026-10-22 09:30 UTC; integrity pending',purpose:'Tìm nguồn tái dựng sau backup.',meaning:'Có log đến 09:30 nhưng chưa xác minh replay được; không hứa phục hồi 12:00.',commandId:'panel-restore-points',aliases:[],context:'panel'},{command:'PANEL: restore validation',output:'Restored backup booted; order integrity check: pending',purpose:'Tách boot success khỏi dữ liệu ứng dụng.',meaning:'OS boot được không chứng minh order database đầy đủ.',commandId:'panel-backup-task',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-11-007',skill:'backup-agent-auth',objective:'Liên hệ key rotation với backup auth failure, bảo vệ secret và xác minh restore.',
 p1:{doc:'journalctl-service',purpose:'backup-agent auth error',meaning:'Agent báo key rejected; chưa biết key nào đã bị thay hoặc permission.'},p2:{doc:'panel-backup-task',purpose:'credential rotation event',meaning:'Panel ghi key rotated gần sự cố; cần đối chiếu key ID và scope, không lộ secret.',context:'panel'},
 symptom:'Scheduled backup fail sau key rotation.',redHerring:'Datastore đầy 99.9%.',finding:'Auth failure và rotation cùng thời gian; nghi credential agent chưa đồng bộ, cần audit key ID.',overclaim:'Chỉ cần dán secret mới vào ticket để support sửa.',safeNext:'Đối chiếu credential reference/scope qua kênh an toàn, owner/backup team cập nhật theo runbook có rollback.',unsafe:'Gửi private key qua ticket hoặc tắt xác thực backup.',verify:'Backup task mới thành công, artifact hash/restore test đạt và secret không lộ.',wrongChecks:['df -h /','dig example.com A'],
 extras:[{command:'PANEL: backup credential audit',output:'key_id=backup-key-7 rotated 2026-10-22 01:30 UTC; agent reference=backup-key-6',purpose:'So key ID agent với panel.',meaning:'Agent tham chiếu key cũ; cần đội có quyền cập nhật secret store.',commandId:'panel-backup-task',aliases:[],context:'panel'},{command:'PANEL: last verified backup',output:'2026-10-21 00:00 UTC; restore test passed 2026-10-21 01:20 UTC',purpose:'Biết mốc backup an toàn gần nhất.',meaning:'Có restore point cũ; job mới vẫn failed và RPO đang tăng.',commandId:'panel-backup-status',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-11-008',skill:'restore-ip-conflict',objective:'Nhận diện duplicate IP của restored VM và cô lập mạng trước khi bật.',
 p1:{doc:'panel-ip-allocation',purpose:'IP trên NIC restored VM',meaning:'Restored VM được cấu hình IP .20; chưa biết NIC đang connected.',context:'panel'},p2:{doc:'panel-ip-allocation',purpose:'IP của live VM',meaning:'Production VM cũng dùng IP .20; nếu cùng mạng sẽ xung đột.',context:'panel'},
 symptom:'Restored VM gây conflict với production.',redHerring:'Backup archive bị Unexpected EOF.',finding:'Hai VM cùng IP trong panel; cần xem network attachment/VM state và giữ restored VM cách ly.',overclaim:'Chỉ đổi DNS A record sẽ hết duplicate IP ở layer 3.',safeNext:'Ngắt/giữ NIC restored VM ở mạng cách ly qua đội ảo hóa, xác nhận owner và IP plan trước restore test.',unsafe:'Tắt production VM hoặc bật restored VM trên public bridge để thử.',verify:'Production IP hoạt động ổn, restored VM dùng isolated network/IP riêng và dữ liệu restore được kiểm chứng.',wrongChecks:['df -h /','systemctl status nginx'],
 extras:[{command:'PANEL: restored VM network state',output:'restored-vm NIC: connected to br-public; VM state=Running',purpose:'Đánh giá conflict hiện hữu.',meaning:'NIC cùng public bridge và VM Running; cần ưu tiên cô lập restored VM theo incident.',commandId:'panel-probes',aliases:[],context:'panel'},{command:'PANEL: ARP conflict events',output:'10:20-10:25 UTC duplicate IPv4 198.51.100.20 observed from two MACs',purpose:'Xác nhận conflict trên network.',meaning:'Có xung đột ở layer 2/3; không sửa production IP mù.',commandId:'panel-probes',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-12-001',skill:'provision-ipam-capacity',objective:'Phân biệt thanh toán với provisioning thất bại vì IPAM pool cạn.',
 p1:{doc:'panel-provision-task',purpose:'provisioning task result',meaning:'Provisioning failed; chưa có VPS sử dụng được.',context:'panel'},p2:{doc:'panel-ip-allocation',purpose:'IPv4 pool availability',meaning:'Pool sg-02 không còn IPv4; cần đội IPAM/capacity.',context:'panel'},
 symptom:'Đã thanh toán nhưng VPS vẫn Provisioning.',redHerring:'Guest có IP nhưng default route thiếu.',finding:'Task fail vì IPAM pool không còn IPv4; chưa có VM ready để hỗ trợ guest.',overclaim:'Thanh toán xong nghĩa là IP đã được cấp.',safeNext:'Chuyển IPAM/provisioning capacity, báo trạng thái trung thực và phương án được owner duyệt.',unsafe:'Tự gán IP ngoài pool hoặc tạo VM khác ngẫu nhiên.',verify:'IPAM cấp IP hợp lệ, provision task hoàn tất, panel và guest/network khớp.',wrongChecks:['ip route','systemctl status sshd'],
 extras:[{command:'PANEL: IPAM pool sg-02',output:'Available IPv4=0; pending allocation requests=14',purpose:'Xác nhận pool capacity.',meaning:'Capacity thiếu, cần đội IPAM xử lý; không được đoán địa chỉ.',commandId:'panel-ip-allocation',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-12-002',skill:'panel-stale-state',objective:'Đối chiếu panel last sync với libvirt và SSH, không restart VM vì nhãn Stopped cũ.',
 p1:{doc:'panel-probes',purpose:'VM state và last sync ở panel',meaning:'Panel ghi Stopped nhưng dữ liệu cũ 50 phút.',context:'panel'},p2:{doc:'virsh-dominfo',purpose:'VM state trực tiếp từ host',meaning:'Libvirt hiện Running; cần kiểm tra guest/health riêng.',context:'hypervisor'},
 symptom:'Panel ghi Stopped nhưng khách SSH được.',redHerring:'VM thật sự Powered Off và không có network.',finding:'Panel state stale so với host Running; đây là lỗi đồng bộ control-plane khả dĩ.',overclaim:'Vì SSH được một lần nên panel sync đã tự sửa.',safeNext:'Giữ VM đang chạy, thu task sync/error, chuyển control-plane; xác minh guest qua client.',unsafe:'Bấm start/reboot vì panel ghi Stopped.',verify:'Panel cập nhật Running đúng host, SSH/app vẫn hoạt động và sync không trễ.',wrongChecks:['df -h /','dig example.com A'],
 extras:[{command:'PANEL: state sync worker',output:'vm-110 sync last_success=2026-10-22 08:00 UTC; current=08:50 UTC; worker queue backlog=124',purpose:'Đọc sync worker.',meaning:'Queue lag phù hợp panel stale; cần control-plane xử lý.',commandId:'panel-task-queue',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-12-003',skill:'wrong-os-template',objective:'Đối chiếu OS đặt mua với guest thực, bảo vệ dữ liệu trước quyết định reprovision.',
 p1:{doc:'panel-provision-task',purpose:'ordered OS trong panel',meaning:'Đơn hàng là AlmaLinux 9; không chứng minh image guest thực.',context:'panel'},p2:{doc:'os-release',purpose:'OS ID/version trong guest',meaning:'Guest báo Ubuntu 24.04; khác đơn hàng.'},
 symptom:'Khách đặt AlmaLinux nhưng boot ra Ubuntu.',redHerring:'Chỉ thiếu IPv4 pool.',finding:'Order và guest OS không khớp; cần provision audit, dữ liệu hiện tại và owner.',overclaim:'Có thể reinstall ngay vì OS sai mà không mất dữ liệu.',safeNext:'Xác minh order/template task và dữ liệu khách; chuyển provisioning, đề xuất migration/rebuild chỉ sau backup/approval.',unsafe:'Tự reinstall hoặc xóa VM sai image.',verify:'Owner xác nhận OS đúng, dữ liệu giữ/restore theo plan và service hoạt động.',wrongChecks:['free -h','dig example.com A'],
 extras:[{command:'PANEL: provision image audit',output:'order template=almalinux-9; image applied=ubuntu-24.04; task_id=pr-1203',purpose:'Tìm sai lệch provision.',meaning:'Task ghi áp image không khớp, cần đội provisioning điều tra và sửa quy trình.',commandId:'panel-provision-task',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-12-004',skill:'vcpu-plan-mismatch',objective:'Đối chiếu plan, host config và guest CPU online; không reboot tự ý.',
 p1:{doc:'panel-provision-task',purpose:'vCPU trong plan',meaning:'Panel ghi plan 4 vCPU; không chứng minh guest thấy đủ.',context:'panel'},p2:{doc:'nproc',purpose:'CPU online guest nhìn thấy',meaning:'nproc trả 2; cần so host config và offline CPU.'},
 symptom:'Panel 4 vCPU nhưng guest thấy 2.',redHerring:'Container memory limit 512 MiB.',finding:'Entitlement 4 còn guest online 2; chưa biết host config chưa áp hay CPU offline.',overclaim:'Reboot guest chắc chắn tăng lên 4.',safeNext:'Đối chiếu libvirt vCPU current/max và guest online CPUs; chuyển ảo hóa nếu config chưa áp, lên change nếu cần downtime.',unsafe:'Tự reboot production VPS để thử.',verify:'Host và guest thấy 4 online vCPU, workload bình thường và panel đồng bộ.',wrongChecks:['df -h /','dig example.com A'],
 extras:[{command:'PANEL: host vCPU config',output:'vm-102 current_vcpus=2; max_vcpus=4; update_task=pending',purpose:'Tách max và current vCPU.',meaning:'Host chưa áp current=4; đội ảo hóa cần change/hotplug assessment.',commandId:'panel-provision-task',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-12-005',skill:'reinstall-task-lock',objective:'Đọc task lock và snapshot job trước thay đổi dữ liệu phá hủy.',
 p1:{doc:'panel-task-queue',purpose:'reinstall task lock',meaning:'Reinstall đang chờ lock, chưa thực hiện.',context:'panel'},p2:{doc:'panel-task-queue',purpose:'snapshot task đang chạy',meaning:'Snapshot job giữ lock; không được hủy hay ép reinstall mù.',context:'panel'},
 symptom:'Reinstall vẫn chưa đổi OS sau 40 phút.',redHerring:'Guest đã reinstall thành công nhưng DNS cache chậm.',finding:'Task reinstall chờ lock vì snapshot job; cần kiểm tra progress/ownership và an toàn dữ liệu.',overclaim:'Có thể force unlock rồi chạy reinstall ngay.',safeNext:'Theo dõi snapshot job, xác minh backup/approval và chuyển task queue team nếu kẹt; thông báo khách chưa reinstall.',unsafe:'Hủy snapshot rồi force reinstall trước khi có backup hợp lệ.',verify:'Snapshot hoàn tất/được xử lý có duyệt, reinstall task chỉ chạy khi điều kiện dữ liệu đạt và OS kiểm tra lại.',wrongChecks:['ip route','free -h'],
 extras:[{command:'PANEL: snapshot progress',output:'snapshot task sn-280: 76% after 40 min; last_progress 2 min ago',purpose:'Xem task còn tiến triển.',meaning:'Task đang tiến triển; không có căn cứ force unlock.',commandId:'panel-backup-task',aliases:[],context:'panel'},{command:'PANEL: reinstall safety gate',output:'backup_verified=false; owner_confirmation=pending',purpose:'Xem điều kiện trước reinstall.',meaning:'Dù lock hết vẫn chưa đủ điều kiện an toàn để reinstall.',commandId:'panel-provision-task',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-12-006',skill:'ipv4-allocation-mismatch',objective:'Đối chiếu IP đặt mua, guest IP và provisioning task trước network change.',
 p1:{doc:'panel-ip-allocation',purpose:'order allocation IP',meaning:'Order ghi 198.51.100.20; không chứng minh guest đang dùng.',context:'panel'},p2:{doc:'ip-family-addr',purpose:'IPv4 guest đang cấu hình',meaning:'Guest dùng 203.0.113.40/24; khác allocation.'},
 p2Override:'2: ens3    inet 203.0.113.40/24 brd 203.0.113.255 scope global ens3',
 symptom:'VPS nhận IP khác đơn hàng.',redHerring:'Chỉ resolver DNS không phân giải tên.',finding:'Order IP và guest IP khác nhau; cần xác minh migration/assignment history, không đổi live IP từ SSH.',overclaim:'Guest IP khác order nên chắc chắn IP .40 thuộc khách khác.',safeNext:'Thu panel allocation, IPAM owner, gateway và active sessions; chuyển provisioning/network lập change có console/rollback.',unsafe:'Tự gán .20 trong guest qua phiên SSH duy nhất.',verify:'IPAM, panel, guest IP/route và client reachability khớp kế hoạch được duyệt.',wrongChecks:['df -h /','systemctl status nginx'],
 extras:[{command:'PANEL: IPAM ownership',output:'198.51.100.20 assigned to order-1206; 203.0.113.40 assigned to temporary migration pool',purpose:'Xác nhận ownership hai IP.',meaning:'Guest IP thuộc pool tạm; cần đội IPAM chuyển đúng với kế hoạch.',commandId:'panel-ip-allocation',aliases:[],context:'panel'},{command:'ip route',output:'default via 203.0.113.1 dev ens3',purpose:'Ghi route đang hoạt động trước change.',meaning:'Route theo IP hiện tại; đổi IP cần gateway/rollback đúng.',commandId:'ip-route',aliases:[]}]})
addBatchCase({id:'VPS-12-007',skill:'api-token-scope',objective:'Phân biệt API 403 do scope với VM state và nguyên tắc quyền tối thiểu.',
 p1:{doc:'panel-api-audit',purpose:'HTTP API response',meaning:'API trả 403; chưa biết token sai scope hay resource ownership.',context:'panel'},p2:{doc:'panel-api-audit',purpose:'token scope trong audit',meaning:'Token chỉ có read:vm; không có quyền reboot:vm.',context:'panel'},
 symptom:'Khách không reboot được VM qua API.',redHerring:'VM chắc chắn Powered Off.',finding:'403 và token read:vm hỗ trợ thiếu action scope; cần kiểm tra resource/owner và policy.',overclaim:'Cấp admin:* token cho khách là giải pháp an toàn.',safeNext:'Xác minh identity, VM ownership, API policy; hướng dẫn tạo token tối thiểu được owner duyệt hoặc chuyển IAM.',unsafe:'Mượn admin token hoặc tự reboot VM thay khách.',verify:'Token đúng scope được duyệt, API dry-run/authorized request thành công và audit ghi nhận.',wrongChecks:['df -h /','systemctl status sshd'],
 extras:[{command:'PANEL: API permission matrix',output:'read:vm -> GET /vm; reboot:vm -> POST /vm/{id}/reboot; token has read:vm only',purpose:'Đối chiếu endpoint với scope cần.',meaning:'Thiếu reboot:vm; vẫn cần ownership và policy trước cấp quyền.',commandId:'panel-api-audit',aliases:[],context:'panel'},{command:'PANEL: token ownership',output:'token t-77 owner=account-1207; vm-1207 owner=account-1207',purpose:'Xác minh resource ownership.',meaning:'Owner khớp; chỉ còn scope/policy approval.',commandId:'panel-api-audit',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-12-008',skill:'duplicate-provision-order',objective:'Điều tra duplicate task/VM và billing trước khi xóa hoặc cấp thêm tài nguyên.',
 p1:{doc:'panel-provision-task',purpose:'provision tasks cho order',meaning:'Order-771 có hai completion events; cần phân biệt retry/idempotency.',context:'panel'},p2:{doc:'panel-provision-task',purpose:'VM inventory của order',meaning:'Hai VM ID tồn tại; chưa biết VM nào có dữ liệu hoặc billing.',context:'panel'},
 symptom:'VPS xuất hiện hai lần sau retry purchase.',redHerring:'Guest thiếu default route.',finding:'Task complete hai lần và hai VM ID; nghi idempotency issue, không được tự xóa VM.',overclaim:'VM thứ hai chắc chắn là bản rỗng, xóa an toàn.',safeNext:'Giữ cả hai, đối chiếu order/billing/VM activity/IP và owner; chuyển provisioning/billing xử lý duplicate có phê duyệt.',unsafe:'Delete vm-771b hoặc phát hành hóa đơn thứ hai tự động.',verify:'Owner xác nhận VM đúng, billing/allocations được chỉnh và dữ liệu VM còn lại an toàn.',wrongChecks:['ip route','df -h /'],
 extras:[{command:'PANEL: VM activity comparison',output:'vm-771a created 10:00 UTC; login activity 10:20 UTC\nvm-771b created 10:03 UTC; no login recorded',purpose:'Xem mức sử dụng hai VM.',meaning:'Bản b có thể ít dùng nhưng vẫn cần owner và storage review trước xóa.',commandId:'panel-provision-task',aliases:[],context:'panel'},{command:'PANEL: billing order-771',output:'Invoice lines: 1 VPS; allocated resources: 2 VMs',purpose:'Đối chiếu billing với resources.',meaning:'Billing một dòng nhưng cấp hai VM; cần đội provisioning/billing reconcile.',commandId:'panel-provision-task',aliases:[],context:'panel'}]})
// Batch 7: billing and lifecycle observations are panel data, never shell
// commands or authorization to alter a customer's service.
addBatchCase({id:'VPS-14-001',skill:'billing-suspension',objective:'Đối chiếu service suspension với invoice và payment state trước khi hứa mở lại.',
 p1:{doc:'billing-service',purpose:'trạng thái dịch vụ trong billing',meaning:'Dịch vụ Suspended do invoice overdue; chưa cho biết khách đã thanh toán sau snapshot.',context:'panel'},p2:{doc:'billing-invoice',purpose:'trạng thái invoice liên quan',meaning:'INV-2026-101 overdue trong panel; cần đối chiếu payment transaction.',context:'panel'},
 symptom:'Dashboard đột ngột ghi Suspended.',redHerring:'Guest chỉ có SSH Permission denied.',finding:'Service bị suspend và invoice overdue trong snapshot; quyền mở lại phụ thuộc billing/payment policy.',overclaim:'Có thể mở lại bằng reboot VM dù invoice overdue.',safeNext:'Xác minh invoice/payment event và account owner; hướng dẫn quy trình billing hoặc chuyển billing team.',unsafe:'Tự unsuspend dịch vụ hoặc yêu cầu khách gửi thẻ qua ticket.',verify:'Billing xác nhận trạng thái hợp lệ, panel cập nhật và guest service được kiểm tra riêng.',wrongChecks:['systemctl status sshd','ip route'],
 extras:[{command:'BILLING: payment transaction INV-2026-101',output:'No settled payment recorded for INV-2026-101 at 2026-10-22 10:00 UTC',purpose:'Đối chiếu transaction đã settle.',meaning:'Tại snapshot chưa có settled payment; vẫn cần xem event mới trước thông báo cuối.',commandId:'billing-invoice',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-14-002',skill:'payment-provision-event',objective:'Tách invoice Paid khỏi event provisioning và tránh thu tiền trùng.',
 p1:{doc:'billing-invoice',purpose:'invoice payment state',meaning:'Invoice Paid; không chứng minh webhook/provision task đã xử lý.',context:'panel'},p2:{doc:'panel-provision-task',purpose:'provisioning wait state',meaning:'Provision đang chờ payment event dù invoice đã Paid.',context:'panel'},
 symptom:'Khách đã trả tiền nhưng VPS còn Pending.',redHerring:'VPS Running và đã SSH được.',finding:'Billing Paid nhưng provision chờ event; có thể lag/missing event, cần audit queue.',overclaim:'Yêu cầu khách trả lại vì panel chưa provision.',safeNext:'Đối chiếu payment ID, webhook và order queue; chuyển billing/provisioning reconcile idempotent.',unsafe:'Thu tiền lại hoặc tạo VM thứ hai thủ công.',verify:'Một order tạo đúng một VM, panel Active và invoice không bị charge trùng.',wrongChecks:['df -h /','systemctl status nginx'],
 extras:[{command:'PANEL: payment event audit',output:'payment_id=pay-2202 settled=09:10 UTC; webhook delivery=failed; order=ord-1402',purpose:'Xác minh event giữa billing và provisioning.',meaning:'Payment đã settle nhưng webhook failed; đội control-plane phải reconcile an toàn.',commandId:'panel-task-queue',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-14-003',skill:'end-term-cancellation',objective:'Phân biệt end-of-term cancellation với xóa VPS ngay và bảo vệ dữ liệu.',
 p1:{doc:'billing-service',purpose:'service end date',meaning:'Service Active đến 15/11; chưa hủy ngay.',context:'panel'},p2:{doc:'panel-lifecycle-policy',purpose:'policy hủy cuối kỳ',meaning:'Panel hỗ trợ end-of-term cancellation; cần owner xác nhận ngày và dữ liệu.',context:'panel'},
 symptom:'Khách yêu cầu hủy VPS cuối chu kỳ.',redHerring:'Khách yêu cầu reboot VM ngay.',finding:'Service còn Active và policy cho hủy cuối kỳ; chưa có lệnh hủy được phê duyệt.',overclaim:'Yêu cầu hủy cuối kỳ cho phép xóa disk ngay hôm nay.',safeNext:'Xác minh account owner, thời hạn và backup/export; ghi yêu cầu cancellation đúng mốc theo policy.',unsafe:'Terminate VPS ngay hoặc xóa backup trước ngày hết hạn.',verify:'Panel ghi cancellation effective date đúng, khách nhận xác nhận và dữ liệu được xử lý theo policy.',wrongChecks:['systemctl status sshd','free -h'],
 extras:[{command:'BILLING: cancellation request audit',output:'No cancellation request submitted for service VPS-1403',purpose:'Kiểm tra request đã được ghi chưa.',meaning:'Chưa có request; cần owner xác thực và thực hiện quy trình.',commandId:'billing-service',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-14-004',skill:'refund-review',objective:'Đọc ngày mua và policy review, không tự hứa refund.',
 p1:{doc:'billing-invoice',purpose:'purchase timestamp',meaning:'Mua ngày 15/10 trong billing; cần policy và ticket review.',context:'panel'},p2:{doc:'panel-lifecycle-policy',purpose:'refund eligibility policy',meaning:'Eligibility requires review; không có auto approval.',context:'panel'},
 symptom:'Khách muốn refund sau bảy ngày.',redHerring:'Khách chỉ muốn đổi DNS record.',finding:'Ngày mua và policy cho thấy cần review; chưa có kết luận eligible hay số tiền.',overclaim:'Đúng bảy ngày nên refund tự động 100%.',safeNext:'Xác minh owner, invoice, thời gian và điều khoản áp dụng; chuyển billing review, không hứa kết quả.',unsafe:'Tự phát refund hoặc yêu cầu thông tin thẻ qua ticket.',verify:'Billing đưa quyết định có audit, giao dịch và trạng thái service được đối chiếu theo policy.',wrongChecks:['ip route','df -h /'],
 extras:[{command:'BILLING: refund request state',output:'Request RF-1404: not submitted; decision: none',purpose:'Phân biệt yêu cầu với quyết định.',meaning:'Chưa có hồ sơ review; support không được tuyên bố approved.',commandId:'billing-invoice',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-14-005',skill:'ipv4-addon-review',objective:'Tách addon đã thanh toán khỏi IPAM allocation và manual review.',
 p1:{doc:'billing-invoice',purpose:'addon billing state',meaning:'Additional IPv4 addon Active; chưa có IP được cấp.',context:'panel'},p2:{doc:'panel-ip-allocation',purpose:'IP allocation work state',meaning:'Allocation pending manual review; không phải lỗi network guest.',context:'panel'},
 symptom:'Khách trả tiền IPv4 bổ sung nhưng chỉ thấy một IP.',redHerring:'Guest mất default route cho IP hiện có.',finding:'Addon active nhưng cấp IP còn review; cần biết policy và pool capacity.',overclaim:'Addon Active đồng nghĩa IP mới phải có trong guest rồi.',safeNext:'Đối chiếu manual review, lý do chính sách/pool và order; chuyển IPAM, báo thời gian xử lý trung thực.',unsafe:'Tự gán IP bất kỳ hoặc đổi IP hiện có trong guest.',verify:'IP được phê duyệt/cấp đúng owner, panel/guest route khớp và client reachability kiểm tra.',wrongChecks:['df -h /','systemctl status nginx'],
 extras:[{command:'PANEL: IPv4 addon review',output:'case IP-1405 pending; ownership validation complete; pool assignment pending',purpose:'Định vị bước review còn lại.',meaning:'Thiếu pool assignment, chưa thể công bố IP hoặc thay guest.',commandId:'panel-ip-allocation',aliases:[],context:'panel'},{command:'PANEL: IPAM capacity',output:'region sg-02 free IPv4=3; reserved for approved requests=3',purpose:'Xem pool thực còn địa chỉ cấp tự do không.',meaning:'Không có IP chưa reserve; cần đội IPAM/capacity quyết định.',commandId:'panel-ip-allocation',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-14-006',skill:'retention-deletion-risk',objective:'Đọc mốc expiration/deletion, yêu cầu hold có quyền và bảo vệ dữ liệu.',
 p1:{doc:'billing-service',purpose:'expiration date',meaning:'Service hết hạn 20/10; không nói dữ liệu đã bị xóa.',context:'panel'},p2:{doc:'panel-lifecycle-policy',purpose:'scheduled deletion date',meaning:'Deletion scheduled 25/10; thời gian còn ít và policy/approval quyết định hold.',context:'panel'},
 symptom:'Khách muốn kéo dài retention trước deletion.',redHerring:'VPS chỉ có lỗi chứng chỉ TLS.',finding:'Service expired và scheduled deletion sắp tới; cần escalation khẩn để xem hold hợp lệ.',overclaim:'Support có thể hứa giữ dữ liệu vô hạn bằng ticket này.',safeNext:'Xác minh owner, policy và trạng thái backup; chuyển billing/lifecycle on-call xin hold có audit trước deadline.',unsafe:'Tự hủy deletion task hoặc đảm bảo dữ liệu chưa sao lưu.',verify:'Hold/extension được xác nhận bằng task ID và thời hạn mới; dữ liệu/backup trạng thái rõ.',wrongChecks:['systemctl status sshd','dig example.com A'],
 extras:[{command:'PANEL: retention hold state',output:'service VPS-1406 hold=false; deletion_job=2026-10-25 00:00 UTC',purpose:'Xem hold thực đã áp chưa.',meaning:'Chưa có hold; support phải escalation kịp thời, không báo đã gia hạn.',commandId:'panel-lifecycle-policy',aliases:[],context:'panel'},{command:'PANEL: backup availability VPS-1406',output:'Last completed backup: 2026-10-19 00:00 UTC; restore verification: pending',purpose:'Đọc khả năng bảo toàn dữ liệu.',meaning:'Có backup cũ nhưng restore chưa kiểm chứng; không thay thế hold/owner approval.',commandId:'panel-backup-status',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-14-007',skill:'duplicate-billing-line',objective:'Phân biệt duplicate invoice line với số VM thực và chuyển billing reconciliation.',
 p1:{doc:'billing-invoice',purpose:'invoice lines',meaning:'Invoice có hai dòng VPS-100; chưa biết gateway charge mấy lần.',context:'panel'},p2:{doc:'panel-provision-task',purpose:'service records',meaning:'Panel chỉ có một VPS-100; cần đối chiếu order/payment ledger.',context:'panel'},
 symptom:'Hóa đơn tính hai VPS nhưng khách chỉ đặt một.',redHerring:'Hai VM đang chạy với hai IP khác nhau.',finding:'Hai invoice lines cùng service nhưng panel chỉ một service; nghi duplicate billing line, phải đối chiếu ledger.',overclaim:'Có thể tự refund một dòng mà chưa kiểm tra settled payments/tax.',safeNext:'Giữ invoice/order/payment IDs, xác minh owner và chuyển billing sửa invoice/refund theo policy.',unsafe:'Xóa VM hoặc sửa invoice thủ công không audit.',verify:'Billing phát hành hóa đơn đúng, payment/refund ledger khớp và khách thấy một dịch vụ.',wrongChecks:['ip route','df -h /'],
 extras:[{command:'BILLING: settled payment ledger',output:'invoice INV-1407 payment_id=pay-1407 amount=2x VPS plan; settled once',purpose:'Phân biệt invoice line trùng với charge giao dịch.',meaning:'Một giao dịch nhưng số tiền hai plan; billing cần xác định số tiền điều chỉnh.',commandId:'billing-invoice',aliases:[],context:'panel'},{command:'PANEL: order history VPS-100',output:'order ord-1407 quantity=1; provisioned VM count=1',purpose:'Xác nhận lượng đặt và cấp.',meaning:'Order một VM, củng cố billing mismatch; không tự quyết định refund.',commandId:'panel-provision-task',aliases:[],context:'panel'}]})
addBatchCase({id:'VPS-14-008',skill:'abuse-suspension-appeal',objective:'Tách abuse hold khỏi nonpayment và xử lý appeal theo security policy.',
 p1:{doc:'billing-service',purpose:'suspension reason',meaning:'Service Suspended vì abuse case AB-2026-14; không phải overdue invoice.',context:'panel'},p2:{doc:'panel-security-case',purpose:'security investigation state',meaning:'Investigation Open; chưa được phép unsuspend.',context:'panel'},
 symptom:'Khách muốn VPS đang bị abuse suspension online ngay.',redHerring:'Invoice quá hạn là lý do duy nhất.',finding:'Suspension gắn abuse investigation còn mở; không thể tự mở lại trước quyết định security.',overclaim:'Khách yêu cầu gấp là đủ để override abuse hold.',safeNext:'Xác minh owner, gửi appeal/evidence qua quy trình, chuyển abuse/security và thông báo status/ETA nếu có.',unsafe:'Unsuspend, đổi IP hoặc xóa logs để né investigation.',verify:'Security ra quyết định có audit, panel state đúng quyết định và network/service được kiểm tra nếu được mở.',wrongChecks:['systemctl status sshd','df -h /'],
 extras:[{command:'PANEL: abuse case timeline',output:'AB-2026-14 opened 2026-10-22 11:00 UTC; appeal status=received; reviewer=security-oncall',purpose:'Theo dõi appeal và owner xử lý.',meaning:'Appeal đã nhận, chưa có quyết định mở lại.',commandId:'panel-security-case',aliases:[],context:'panel'},{command:'PANEL: suspension policy',output:'AB-2026-14 hold active until security review completed; override permission=security-lead',purpose:'Xác nhận quyền quyết định.',meaning:'Support không có quyền override; chỉ escalation.',commandId:'panel-security-case',aliases:[],context:'panel'}]})
guidedContent.push(...guidedBatch2)

// Independent review uses a different customer situation and fresh evidence.
// These fixtures are never passed to the terminal; they are authored assessment data.
const reviewAuthoring = {
  'VPS-01-001': {
    id: 'ssh-alt-1', scenario: 'Một VPS CentOS Stream 9 vừa cập nhật cấu hình. Console hoạt động, nhưng SSH từ laptop tới 203.0.113.31 bị Connection refused.',
    evidence: [{ label: 'Guest console · systemctl status sshd', output: 'Active: inactive (dead)' }, { label: 'Guest console · ss -ltnp', output: 'LISTEN 0 128 0.0.0.0:80 users:(("nginx",pid=801,fd=6))' }],
    questions: [
      q('r-symptom', 'triage', 'single_choice', 'Connection refused trong tình huống mới xảy ra trước bước nào?', [['auth', 'Trước xác thực tài khoản', 'Đúng: TCP không được chấp nhận.'], ['key', 'Sau khi khóa SSH được xác nhận', 'Chưa có phiên xác thực.'], ['shell', 'Sau khi shell đăng nhập mở', 'Chưa tới shell.']], ['auth'], 'Lỗi TCP cần tách khỏi lỗi mật khẩu hoặc khóa.'),
      q('r-evidence', 'interpret', 'multi_select', 'Hai output hiện chứng minh những điều nào?', [['off', 'sshd hiện không chạy', 'Đúng theo trạng thái service.'], ['no22', 'Không thấy listener TCP/22 trong output đã cho', 'Đúng trong snapshot này.'], ['why', 'Đã xác định nguyên nhân daemon dừng', 'Cần journal hoặc cấu hình để kết luận nguyên nhân.']], ['off', 'no22'], 'Trạng thái và listener là bằng chứng hiện tượng, chưa phải root cause.'),
      q('r-next', 'decide', 'single_choice', 'Sau khi xác nhận quyền thao tác, bước nào an toàn nhất?', [['logs', 'Đọc journal/config trước; nếu phù hợp start sshd và kiểm tra lại từ client', 'Đúng: điều tra rồi thay đổi có kiểm soát.'], ['reboot', 'Reboot VPS ngay', 'Tác động rộng và chưa cần thiết.'], ['close', 'Báo resolved khi thấy nginx chạy', 'Nginx không chứng minh SSH hoạt động.']], ['logs'], 'Sau start vẫn phải xác minh kết nối và xác thực từ client.'),
    ],
  },
  'VPS-02-001': {
    id: 'route-alt-1', scenario: 'Một VPS Ubuntu dùng console được nhưng không kết nối tới IP ngoài subnet sau khi thay đổi mạng. Bạn có console dự phòng.',
    evidence: [{ label: 'Guest · ip route', output: '172.16.4.0/24 dev ens3 proto kernel scope link src 172.16.4.21' }, { label: 'Panel · cấu hình cấp phát', output: 'Assigned gateway: 172.16.4.1; interface: ens3' }],
    questions: [
      q('r-symptom', 'triage', 'single_choice', 'Phạm vi ảnh hưởng phù hợp nhất với dữ liệu hiện có?', [['outside', 'Kết nối ngoài subnet cần được điều tra', 'Đúng: local route vẫn còn.'], ['all', 'Mọi giao tiếp mạng của VPS đều hỏng', 'Route cùng subnet vẫn có.'], ['dns', 'Chỉ DNS bị lỗi', 'Chưa có phép kiểm tra DNS.']], ['outside'], 'Định phạm vi theo đích không tới được và route thực tế.'),
      q('r-evidence', 'interpret', 'multi_select', 'Chọn hai nhận định được dữ liệu hỗ trợ.', [['missing', 'Không có default route trong snapshot', 'Đúng theo ip route.'], ['assigned', 'Panel cấp gateway 172.16.4.1 cho ens3', 'Đúng theo panel.'], ['upstream', 'Upstream chắc chắn cho phép traffic', 'Chưa kiểm tra upstream.']], ['missing', 'assigned'], 'Gateway được cấp là bằng chứng cần thiết trước khi sửa route.'),
      q('r-next', 'verify', 'single_choice', 'Nếu route được khôi phục có kiểm soát, kiểm tra nào đủ thận trọng?', [['both', 'ip route get tới IP ngoài và thử kết nối thực từ guest/client', 'Đúng: route lookup không chứng minh reachability.'], ['table', 'Chỉ thấy default trong ip route là đóng ticket', 'Bảng route chưa chứng minh đường đi thực.'], ['guess', 'Đổi sang gateway .254 để chắc chắn', 'Không tự đoán gateway.']], ['both'], 'Giữ console/rollback và kiểm tra traffic sau thay đổi.'),
    ],
  },
  'VPS-03-001': {
    id: 'nginx-alt-1', scenario: 'Một trang trên VPS Ubuntu báo 502. Khách nghi Nginx bị dừng sau deploy; bạn kiểm tra từ guest trước khi đề xuất restart.',
    evidence: [{ label: 'Guest · systemctl status nginx', output: 'Active: active (running)' }, { label: 'Guest · curl -I http://127.0.0.1', output: 'HTTP/1.1 502 Bad Gateway\nServer: nginx' }],
    questions: [
      q('r-symptom', 'triage', 'single_choice', 'HTTP 502 ở đây biểu thị điều gì?', [['gateway', 'Nginx trả lời nhưng phía upstream có vấn đề cần kiểm tra', 'Đúng: Nginx đã phản hồi HTTP.'], ['off', 'Nginx chắc chắn đã dừng', 'Service đang active.'], ['dns', 'Tên miền chắc chắn sai DNS', 'Curl localhost không dùng DNS domain.']], ['gateway'], 'Đừng gán lỗi 502 cho service đã dừng khi output nói ngược lại.'),
      q('r-evidence', 'interpret', 'multi_select', 'Điều nào được hai output xác nhận?', [['nginx', 'Nginx đang active', 'Đúng theo systemctl.'], ['http', 'HTTP local trả 502', 'Đúng theo curl.'], ['app', 'Ứng dụng upstream đã hoạt động bình thường', '502 không chứng minh upstream khỏe.']], ['nginx', 'http'], 'Phân biệt web server sống với ứng dụng đằng sau hoạt động.'),
      q('r-next', 'decide', 'single_choice', 'Bước điều tra tiếp phù hợp nhất?', [['upstream', 'Kiểm tra error log và trạng thái/endpoint upstream theo cấu hình', 'Đúng: bám vào 502.'], ['restart', 'Restart Nginx liên tục cho tới khi hết 502', 'Không có bằng chứng restart xử lý upstream.'], ['close', 'Đóng ticket vì service active', 'HTTP vẫn lỗi.']], ['upstream'], 'Chọn phép kiểm tra bổ sung trước khi thay đổi dịch vụ.'),
    ],
  },
  'VPS-05-001': {
    id: 'disk-alt-1', scenario: 'Một VPS ghi log ứng dụng thất bại với ENOSPC. Dung lượng inode chưa rõ; khách yêu cầu xóa toàn bộ log ngay.',
    evidence: [{ label: 'Guest · df -h /', output: '/dev/vda1 40G 40G 0 100% /' }, { label: 'Guest · du -sh /var/log', output: '6.2G /var/log' }],
    questions: [
      q('r-symptom', 'triage', 'single_choice', 'Dấu hiệu ban đầu phù hợp nhất?', [['blocks', 'Root filesystem hết block khả dụng', 'Đúng theo df -h.'], ['inode', 'Chắc chắn chỉ hết inode', 'Chưa chạy df -i.'], ['ram', 'RAM đã cạn', 'Không có dữ liệu RAM.']], ['blocks'], 'ENOSPC và df cho thấy thiếu chỗ; vẫn cần tìm nguồn sử dụng.'),
      q('r-evidence', 'interpret', 'multi_select', 'Bằng chứng hiện tại hỗ trợ điều nào?', [['full', '/ đang 100% theo df', 'Đúng.'], ['logs', '/var/log chiếm 6.2G', 'Đúng theo du.'], ['all', 'Mọi file trong /var/log đều xóa an toàn', 'Không có phân loại retention hay file đang mở.']], ['full', 'logs'], 'Dung lượng thư mục không phải giấy phép xóa toàn bộ.'),
      q('r-next', 'decide', 'single_choice', 'Hướng xử lý an toàn nhất cho yêu cầu của khách?', [['scope', 'Xác nhận retention/backup, tìm file hoặc journal tăng và dọn phạm vi được duyệt rồi đo lại', 'Đúng: kiểm soát phạm vi và xác minh.'], ['rm', 'rm -rf /var/log', 'Mất bằng chứng và có thể làm hỏng service.'], ['ignore', 'Bỏ qua vì /var/log chỉ 6.2G', 'Filesystem đã đầy.']], ['scope'], 'Sau dọn phải đo lại dung lượng và thử thao tác ứng dụng.'),
    ],
  },
  'VPS-05-004': {
    id: 'storage-alt-1', scenario: 'Khách không ghi được vào /srv/data của VPS. Mount chuyển sang read-only và kernel xuất hiện lỗi I/O lặp lại ở volume dữ liệu.',
    evidence: [{ label: 'Guest · findmnt -no SOURCE,OPTIONS /srv/data', output: '/dev/vdc1 ro,relatime' }, { label: 'Guest · dmesg | tail', output: 'blk_update_request: I/O error, dev vdc, sector 2048' }],
    questions: [
      q('r-symptom', 'triage', 'single_choice', 'Tình trạng nào cần ưu tiên ở L1?', [['risk', 'Rủi ro integrity dữ liệu trên volume cần giữ nguyên trạng và chuyển cấp', 'Đúng: lỗi I/O và ro có rủi ro.'], ['quota', 'Chắc chắn khách hết quota', 'Không có bằng chứng quota.'], ['dns', 'DNS domain lỗi', 'Không liên quan.']], ['risk'], 'Đừng ép một sửa chữa tại guest khi storage đang báo I/O error.'),
      q('r-evidence', 'interpret', 'multi_select', 'Chọn quan sát thật sự có trong output.', [['ro', 'Volume vdc1 đang ro', 'Đúng theo findmnt.'], ['io', 'Kernel có lỗi I/O trên vdc', 'Đúng theo dmesg.'], ['hardware', 'Đã xác định đĩa vật lý nào hỏng', 'Không có dữ liệu hypervisor hoặc provider.']], ['ro', 'io'], 'Guest cho thấy lỗi, chưa định vị phần cứng vật lý.'),
      q('r-next', 'decide', 'single_choice', 'Quyết định đúng phạm vi L1?', [['escalate', 'Dừng thao tác ghi, kiểm tra backup và mở incident cho đội storage', 'Đúng: bảo vệ dữ liệu và chuyển cấp.'], ['remount', 'Remount rw rồi tiếp tục ghi', 'Có thể tăng rủi ro mất dữ liệu.'], ['fsck', 'Chạy fsck trên volume đang dùng ngay', 'Cần quy trình và đội có thẩm quyền.']], ['escalate'], 'Escalation là kết quả hợp lệ; chỉ xác minh incident được tiếp nhận.'),
    ],
  },
  'VPS-08-003': {
    id: 'dns-alt-1', scenario: 'Khách sửa A record tại DNS panel của nhà cung cấp mới nhưng website vẫn trỏ IP cũ sau khi chuyển nameserver.',
    evidence: [{ label: 'Client · dig store.example.test NS', output: 'store.example.test. 3600 IN NS ns-old.example.test.' }, { label: 'Panel mới · zone', output: 'store.example.test A 203.0.113.44; NS ns-new.example.test' }],
    questions: [
      q('r-symptom', 'triage', 'single_choice', 'Điều gì cần xác định trước khi kết luận propagation?', [['authority', 'Domain thực sự delegate tới nameserver nào', 'Đúng: sửa sai zone sẽ không có hiệu lực.'], ['ssh', 'sshd có chạy không', 'Không liên quan DNS delegation.'], ['disk', 'Disk còn bao nhiêu chỗ', 'Không giải thích nameserver.']], ['authority'], 'Phân biệt panel vừa sửa với nguồn DNS đang có thẩm quyền.'),
      q('r-evidence', 'interpret', 'multi_select', 'Hai output này hỗ trợ kết luận nào?', [['old', 'Điểm truy vấn hiện thấy NS cũ', 'Đúng theo dig.'], ['new', 'Panel mới chứa A record 203.0.113.44', 'Đúng theo panel.'], ['registrar', 'Registrar chắc chắn đã đổi delegation', 'Chưa đọc registrar.']], ['old', 'new'], 'Resolver snapshot và panel là hai nguồn khác nhau.'),
      q('r-next', 'decide', 'single_choice', 'Bước tiếp theo phù hợp nhất?', [['compare', 'Kiểm tra delegation ở registrar và hỏi authoritative NS trực tiếp trước khi thay đổi', 'Đúng: xác định authority và record thực.'], ['delete', 'Xóa zone cũ ngay', 'Có thể cắt dịch vụ khi còn truy vấn NS cũ.'], ['wait', 'Chỉ chờ mà không kiểm tra thêm', 'Có thể đã sửa nhầm nơi.']], ['compare'], 'Chỉ đổi delegation khi chủ domain cho phép; xác minh resolver sau đó.'),
    ],
  },
}
for (const content of guidedContent) if (reviewAuthoring[content.id]) content.reviewVariants = [reviewAuthoring[content.id]]

// Stateful fixtures are authored here, alongside Guided content. P1/P2 remain the
// immutable source-ticket observations; these additional probes describe later states.
const statefulAuthoring = {
  'VPS-03-001': {
    extras: [
      { command: 'systemctl status nginx', output: 'Active: active (running)', purpose: 'Đọc trạng thái Nginx sau start mô phỏng.', meaning: 'Service chạy; chưa chứng minh web app phía sau hoạt động.', commandId: 'systemctl-nginx', aliases: ['sudo systemctl status nginx'], requiredState: ['changed'] },
      { command: 'ss -ltnp', output: 'LISTEN 0 511 0.0.0.0:80 users:(("nginx",pid=812,fd=6))', purpose: 'Xác minh listener HTTP sau start.', meaning: 'Nginx đã nhận TCP/80 trên guest.', commandId: 'ss-ltnp', aliases: [], requiredState: ['changed'] },
      { command: 'curl -I http://127.0.0.1', output: 'HTTP/1.1 502 Bad Gateway\nServer: nginx', purpose: 'Kiểm tra HTTP local sau start.', meaning: 'Nginx trả lời nhưng upstream còn lỗi; không được đóng ticket là resolved.', commandId: 'curl-head', aliases: [], requiredState: ['changed'] },
    ],
    simulation: { states: ['initial', 'changed'], verificationProbeIds: ['G3', 'G4', 'G5'], transitions: [
      { actionId: 'start', commandId: 'systemctl-start', label: 'Start Nginx sau khi xác nhận quyền', from: 'initial', to: 'changed', requiredProbeIds: ['P1', 'P2', 'G1', 'G2'], context: 'guest', safety: 'change', requiresApproval: true, allowed: true, output: 'SIMULATED: systemctl start nginx accepted; check service, listener and HTTP.', feedback: 'Cú pháp hợp lệ và service đã được start trong mô phỏng; HTTP có thể vẫn lỗi nên phải kiểm tra.' },
      { actionId: 'reboot', label: 'Reboot toàn VPS', from: 'initial', to: 'initial', requiredProbeIds: [], context: 'panel', safety: 'change', requiresApproval: true, allowed: false, output: 'SIMULATED: reboot blocked; state unchanged.', feedback: 'Reboot rộng hơn phạm vi sự cố service và chưa có căn cứ.', category: 'unsafe_action' },
    ] },
  },
  'VPS-05-001': {
    extras: [
      { command: 'df -h /', output: '/dev/vda1 20G 19G 1G 95% /', purpose: 'Đo lại block space sau dọn journal được duyệt.', meaning: 'Đã có khoảng 1G trống trong fixture; vẫn cần tìm nguồn log tăng trưởng và xác minh app ghi được.', commandId: 'df-h', aliases: [], requiredState: ['changed'] },
      { command: 'journalctl --disk-usage', output: 'Archived and active journals take up 200.0M in the file system.', purpose: 'Đo journal sau giới hạn lưu trữ.', meaning: 'Journal giảm; không chứng minh tất cả log/app đã an toàn.', commandId: 'journal-disk-usage', aliases: [], requiredState: ['changed'] },
    ],
    simulation: { states: ['initial', 'changed'], verificationProbeIds: ['G3', 'G4'], transitions: [
      { actionId: 'vacuum', commandId: 'journal-vacuum', label: 'Giới hạn journal đã lưu theo chính sách được duyệt', from: 'initial', to: 'changed', requiredProbeIds: ['P1', 'P2', 'G1', 'G2'], context: 'guest', safety: 'change', requiresApproval: true, allowed: true, output: 'SIMULATED: journal vacuum to 200M applied to archived entries; measure free space again.', feedback: 'Chỉ mô phỏng giảm archived journal có phê duyệt. Dung lượng được giải phóng theo fixture, chưa chứng minh app ghi lại được hoặc nguồn log đã ngừng tăng.' },
      { actionId: 'delete', label: 'Xóa toàn bộ /var/log', from: 'initial', to: 'initial', requiredProbeIds: [], context: 'guest', safety: 'change', requiresApproval: true, allowed: false, output: 'SIMULATED: destructive deletion blocked; state unchanged.', feedback: 'Xóa toàn bộ log có thể mất bằng chứng và file đang mở; không có phạm vi hay phê duyệt phù hợp.', category: 'unsafe_action' },
    ] },
  },
  'VPS-02-001': {
    extras: [
      { command: 'PANEL: assigned gateway for enp0s3', output: 'Assigned guest gateway: 10.10.20.1/24; console access available.', purpose: 'Xác nhận gateway được cấp từ panel trước khi đổi route.', meaning: 'Dữ liệu cấp phát này cho phép kiểm tra route đề xuất; không nên đoán gateway từ subnet.', commandId: 'nmcli-show', aliases: [], context: 'panel' },
      { command: 'ip route', output: 'default via 10.10.20.1 dev enp0s3\n10.10.20.0/24 dev enp0s3', purpose: 'Đo lại bảng route sau thay đổi.', meaning: 'Default route đã xuất hiện trong guest.', commandId: 'ip-route', aliases: [], requiredState: ['changed'] },
      { command: 'ip route get 1.1.1.1', output: '1.1.1.1 via 10.10.20.1 dev enp0s3 src 10.10.20.25', purpose: 'Xem kernel chọn đường tới đích ngoài subnet.', meaning: 'Kernel chọn gateway mới; chưa chứng minh upstream cho phép kết nối.', commandId: 'ip-route-get', aliases: [], requiredState: ['changed'] },
      { command: 'ping -c 2 1.1.1.1', output: '2 packets transmitted, 0 received, 100% packet loss', purpose: 'Thử kết nối IP sau khi route xuất hiện.', meaning: 'Đích vẫn không phản hồi ICMP; chưa thể báo sự cố đã hết và cần kiểm tra upstream/TCP.', commandId: 'ping', aliases: [], requiredState: ['changed'] },
    ],
    simulation: { states: ['initial', 'changed'], verificationProbeIds: ['G4', 'G5', 'G6'], transitions: [
      { actionId: 'restore-route', commandId: 'ip-route-add', label: 'Khôi phục default route theo gateway đã cấp', from: 'initial', to: 'changed', requiredProbeIds: ['P1', 'P2', 'G1', 'G2', 'G3'], context: 'guest', safety: 'change', requiresApproval: true, allowed: true, output: 'SIMULATED: default route via 10.10.20.1 added; verify routing and reachability.', feedback: 'Route đã đổi trong fixture. Kết nối ra ngoài vẫn cần kiểm tra; giữ console và phương án rollback.' },
      { actionId: 'guess-route', label: 'Đoán gateway và sửa qua phiên SSH', from: 'initial', to: 'initial', requiredProbeIds: [], context: 'guest', safety: 'change', requiresApproval: true, allowed: false, output: 'SIMULATED: guessed route blocked; state unchanged.', feedback: 'Không đoán gateway hoặc đổi mạng khi thiếu console và rollback.', category: 'unsafe_action' },
    ] },
  },
  'VPS-08-003': {
    extras: [
      { command: 'PANEL: registrar delegation', output: 'Delegated NS: old-dns.example.test', purpose: 'Đọc delegation đang được registrar ghi nhận.', meaning: 'Registrar còn trỏ old-dns; panel zone new-dns chưa được ủy quyền.', commandId: 'panel-zone', aliases: [], context: 'panel' },
      { command: 'dig @new-dns.example.test example.test A', output: 'example.test. 300 IN A 198.51.100.20', purpose: 'Hỏi A record trực tiếp từ new-dns.', meaning: 'Zone mới có IP dự kiến, nhưng chưa chứng minh resolver của người dùng dùng NS này.', commandId: 'dig-a', aliases: [], context: 'client' },
      { command: 'PANEL: registrar delegation', output: 'Delegated NS: new-dns.example.test', purpose: 'Kiểm tra delegation sau thay đổi được duyệt.', meaning: 'Registrar đã ghi new-dns; recursive cache có thể còn dữ liệu cũ.', commandId: 'panel-zone', aliases: [], context: 'panel', requiredState: ['changed'] },
      { command: 'dig example.test NS', output: 'example.test. 1800 IN NS old-dns.example.test.', purpose: 'Kiểm tra resolver phía client sau thay đổi.', meaning: 'Resolver này còn cache NS cũ; không được tuyên bố propagation hoàn tất.', commandId: 'dig-ns', aliases: [], context: 'client', requiredState: ['changed'] },
      { command: 'dig @new-dns.example.test example.test A', output: 'example.test. 300 IN A 198.51.100.20', purpose: 'Xác minh authoritative zone mới.', meaning: 'Authoritative new-dns trả IP mong đợi; người dùng vẫn có thể thấy cache cũ.', commandId: 'dig-a', aliases: [], context: 'client', requiredState: ['changed'] },
    ],
    simulation: { states: ['initial', 'changed'], verificationProbeIds: ['G3', 'G4', 'G5'], transitions: [
      { actionId: 'delegate', commandId: 'registrar-change', label: 'Đổi delegation tại registrar theo chủ domain duyệt', from: 'initial', to: 'changed', requiredProbeIds: ['P1', 'P2', 'G1', 'G2'], context: 'panel', safety: 'change', requiresApproval: true, allowed: true, output: 'SIMULATED: registrar delegation set to new-dns; recursive cache is not flushed.', feedback: 'Đã mô phỏng đổi delegation ở nơi có thẩm quyền. Cần kiểm tra registrar, authoritative answer và cache từ client.' },
      { actionId: 'delete-zone', label: 'Xóa zone cũ ngay', from: 'initial', to: 'initial', requiredProbeIds: [], context: 'panel', safety: 'change', requiresApproval: true, allowed: false, output: 'SIMULATED: zone deletion blocked; state unchanged.', feedback: 'Xóa zone khi resolver còn trỏ NS cũ có thể làm gián đoạn dịch vụ.', category: 'unsafe_action' },
    ] },
  },
  'VPS-05-004': {
    extras: [
      { command: 'PANEL: storage incident status', output: 'No storage incident opened for /dev/vdb.', purpose: 'Xem đã chuyển cấp sự cố storage chưa.', meaning: 'Chưa có đội hạ tầng tiếp nhận; không tự remount rw.', commandId: 'panel-zone', aliases: [], context: 'panel' },
      { command: 'PANEL: storage incident status', output: 'Storage incident opened; infrastructure team assigned; /dev/vdb still under investigation.', purpose: 'Xác minh yêu cầu escalation đã được ghi nhận.', meaning: 'Case đã chuyển cấp, chưa xác nhận volume an toàn để ghi.', commandId: 'panel-zone', aliases: [], context: 'panel', requiredState: ['escalated'] },
      { command: 'findmnt -no SOURCE,OPTIONS /data', output: '/dev/vdb1 ro,relatime', purpose: 'Kiểm tra trạng thái mount khi chờ đội hạ tầng.', meaning: 'Volume vẫn read-only; không báo khách đã sửa xong.', commandId: 'findmnt', aliases: [], requiredState: ['escalated'] },
    ],
    simulation: { states: ['initial', 'escalated'], verificationProbeIds: ['G2', 'G3'], transitions: [
      { actionId: 'escalate', commandId: 'storage-escalation', label: 'Mở incident storage và bảo vệ dữ liệu', from: 'initial', to: 'escalated', requiredProbeIds: ['P1', 'P2', 'G1'], context: 'panel', safety: 'escalate', requiresApproval: false, allowed: true, output: 'SIMULATED: storage incident opened; no guest filesystem changes performed.', feedback: 'Chuyển cấp là kết quả đúng ở L1 khi có Buffer I/O error. Cần theo dõi việc tiếp nhận và tình trạng dữ liệu; chưa giải quyết lỗi ghi.' },
      { actionId: 'remount', label: 'Remount rw và tiếp tục ghi', from: 'initial', to: 'initial', requiredProbeIds: [], context: 'guest', safety: 'change', requiresApproval: true, allowed: false, output: 'SIMULATED: remount blocked; state unchanged.', feedback: 'I/O error khiến remount rw có thể làm rủi ro dữ liệu cao hơn; cần đội storage điều tra.', category: 'unsafe_action' },
    ] },
  },
}

for (const content of guidedContent) {
  const authored = statefulAuthoring[content.id]
  if (authored) { content.extras.push(...authored.extras); content.simulation = authored.simulation }
}

const objectiveVerification = {
  'VPS-01-001': q('exam-verify', 'verify', 'single_choice', 'Sau start, guest báo sshd active, :22 LISTEN nhưng client nhận Permission denied. Kết luận nào đúng?', [['resolved', 'Khách đã đăng nhập được, đóng ticket', 'Permission denied cho thấy xác thực chưa thành công.'], ['partial', 'Kết nối tới xác thực đã phục hồi; cần xử lý account/khóa trước khi báo resolved', 'Đúng: transport phục hồi nhưng login chưa được xác minh.'], ['reboot', 'Reboot để chắc chắn', 'Không giải quyết lỗi xác thực và không có bằng chứng cần reboot.']], ['partial'], 'Xác minh phải bám triệu chứng người dùng, không chỉ service active.'),
  'VPS-03-001': q('exam-verify', 'verify', 'single_choice', 'Sau start Nginx, local curl trả HTTP 502. Bước xác minh nào phù hợp?', [['done', 'Đóng ticket vì port 80 đã LISTEN', '502 vẫn là lỗi ứng dụng/upstream.'], ['upstream', 'Ghi phục hồi listener nhưng điều tra upstream và thử HTTP từ client', 'Đúng: service chạy chưa đồng nghĩa web hoạt động.'], ['dns', 'Chỉ đổi DNS', 'Không có bằng chứng DNS gây local 502.']], ['upstream'], 'HTTP 502 là bằng chứng web vẫn chưa đáp ứng đúng.'),
  'VPS-05-001': q('exam-verify', 'verify', 'single_choice', 'Sau vacuum được duyệt, df còn 1G và journal còn 200M. Có thể kết luận gì?', [['all', 'Ứng dụng đã ghi dữ liệu thành công', 'Chưa có phép thử ghi ở tầng ứng dụng.'], ['space', 'Block space đã có lại; cần thử ghi app và tìm nguồn log tăng trưởng', 'Đúng: đo lại dung lượng chỉ xác minh một phần.'], ['delete', 'Xóa tiếp mọi log để dự phòng', 'Xóa log không có phạm vi, quyền hoặc nhu cầu đã xác minh.']], ['space'], 'Phân biệt dung lượng đã phục hồi và chức năng ứng dụng đã được kiểm chứng.'),
  'VPS-02-001': q('exam-verify', 'verify', 'single_choice', 'Default route đã xuất hiện nhưng ping IP công cộng vẫn 100% loss. Kết luận nào đúng?', [['fixed', 'Internet chắc chắn đã hoạt động', 'Route mới không chứng minh end-to-end reachability.'], ['investigate', 'Route guest đã có; kiểm tra upstream/TCP và chuyển cấp nếu cần', 'Đúng: chưa thể báo resolved chỉ từ ip route.'], ['remove', 'Xóa route và đoán gateway khác', 'Đã có gateway được cấp; không đoán hoặc thay đổi thiếu bằng chứng.']], ['investigate'], 'Route là điều kiện cần, không bảo đảm upstream hoạt động.'),
  'VPS-08-003': q('exam-verify', 'verify', 'single_choice', 'Registrar đã ghi NS mới nhưng resolver client còn NS cũ. Cách trả lời nào chính xác?', [['done', 'Mọi người dùng đã thấy IP mới', 'Recursive cache còn cũ.'], ['pending', 'Delegation đã đổi trong panel; authoritative đúng nhưng client cache còn cũ, cần theo dõi theo TTL', 'Đúng: chỉ xác nhận từng lớp đã kiểm tra.'], ['delete', 'Xóa old-dns ngay', 'Có thể làm lỗi các resolver còn cache delegation cũ.']], ['pending'], 'Xác minh delegation, authoritative answer và resolver client là ba phép kiểm tra khác nhau.'),
  'VPS-05-004': q('exam-verify', 'verify', 'single_choice', 'Đã mở storage incident, /data vẫn ro. Trạng thái ticket nên là gì?', [['resolved', 'Resolved vì đã có incident', 'Escalation chưa sửa volume.'], ['escalated', 'Escalated/đang theo dõi; tránh ghi, chờ đội hạ tầng xác minh storage', 'Đúng: escalation là quyết định đúng nhưng lỗi chưa được sửa.'], ['remount', 'Tự remount rw để khách tiếp tục ghi', 'I/O error làm hành động này có rủi ro dữ liệu.']], ['escalated'], 'Xác minh chuyển cấp không được trình bày như xác minh đã sửa xong.'),
}
for (const content of guidedContent) if (objectiveVerification[content.id]) content.objectiveExam = objectiveVerification[content.id]

