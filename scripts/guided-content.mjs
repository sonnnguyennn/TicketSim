// Hand-authored learning content. The build script splits prompts from answer keys.
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

