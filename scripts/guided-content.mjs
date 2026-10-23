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
    ...(meta.probeOverrides ? { probeOverrides: meta.probeOverrides } : {}),
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
      ], ['direct'], `Đọc P1 trước khi khẳng định nguyên nhân. ${meta.p1.meaning}`, meta.p1.doc),
      ask('output', 'interpret', 'output_interpretation', `Sau khi đọc P1/P2${extraIds.length ? ' và phép kiểm tra bổ sung' : ''}, cách hiểu nào đủ bằng chứng?`, [
        ['supported', meta.finding, 'Đúng: cách diễn giải bám các output đã quan sát.'],
        ['over', meta.overclaim, 'Kết luận này đòi thêm bằng chứng hoặc vượt phạm vi output.'],
        ['ignore', 'Các output không có giá trị điều tra nào.', 'Các output có thông tin hữu ích; cần đọc đúng giới hạn.'],
      ], ['supported'], `Phân biệt bằng chứng với giả thuyết: ${meta.finding}`, meta.p2.doc, advanced ? ['P1', 'P2', ...extraIds] : ['P1', 'P2']),
      ask('evidence', 'interpret', 'multi_select', 'Chọn đúng hai quan sát có trong fixture; bỏ nhận định suy diễn.', [
        ['p1', meta.p1.meaning, 'Đúng theo P1 trong bài này.'],
        ['p2', meta.p2.meaning, 'Đúng theo P2 trong bài này.'],
        ['over', meta.overclaim, 'Chưa được P1/P2 chứng minh.'],
      ], ['p1', 'p2'], 'Hai quan sát đúng không tự động chứng minh mọi mắt xích trong root cause.', meta.p2.doc, ['P1', 'P2']),
      ask('decision', 'decide', 'single_choice', 'Quyết định tiếp theo nào đúng phạm vi và an toàn nhất?', [
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

