// Per-case authoring overrides. IDs and grading keys are inherited, never generated here.
const probe = (purpose, why, meaning, output) => ({ purpose, why, meaning, ...(output === undefined ? {} : { output }) })
const question = (prompt, explanation, options) => ({ prompt, explanation, options })
const answer = (expected_diagnosis, recommended_next_checks, resolution_guidance, verification, escalate_when, production_warning) => ({ expected_diagnosis, recommended_next_checks, resolution_guidance, verification, escalate_when, production_warning })
const refs = {
  libvirt: 'https://libvirt.org/manpages/virsh.html',
  nginx: 'https://nginx.org/en/docs/',
  openssl: 'https://docs.openssl.org/3.0/man1/openssl-s_client/',
  dig: 'https://bind9.readthedocs.io/en/v9.18.41/manpages.html#dig-dns-lookup-utility',
  ssh: 'https://www.openssh.com/manual.html',
  systemd: 'https://www.freedesktop.org/software/systemd/man/latest/journalctl.html',
}

export const sampleIds = ['VPS-06-001', 'VPS-07-005', 'VPS-08-003', 'VPS-09-007', 'VPS-10-005']
export const topicEdits = {
  'VPS-06-001': {
    answerOverrides: answer('Panel ghi máy ảo đã tắt và có yêu cầu shutdown từ tài khoản owner. Chưa có bằng chứng host hỏng hoặc shutdown ngoài ý muốn.', 'Đối chiếu request ID, tài khoản và thời điểm shutdown; xác nhận người có quyền muốn bật lại.', 'Chỉ chuyển yêu cầu start qua người có quyền khi đã xác minh owner và không còn tác vụ bảo trì yêu cầu máy tắt.', 'Kiểm tra panel Running, guest khởi động xong và dịch vụ khách cần dùng phản hồi từ client.', 'Chuyển đội ảo hóa nếu shutdown không có giải thích, lặp lại hoặc VM không khởi động sau yêu cầu được duyệt.', 'Không tự bật máy đang được tắt có chủ đích; không reinstall để chữa tình trạng Powered Off.'),
    customerExplanation: 'Khách không truy cập được VPS. Trước khi kiểm tra từng dịch vụ, cần biết máy ảo còn bật hay đã tắt.',
    hints: ['Không phản hồi qua mạng có thể do máy ảo đã tắt, không nhất thiết do SSH.', 'Xem trạng thái nguồn và thời điểm shutdown trong panel.', 'Đối chiếu yêu cầu shutdown với tài khoản thực hiện; hỏi chủ VPS có muốn bật lại không.'],
    verificationPrompt: 'Ghi trạng thái nguồn, sự kiện shutdown và ai cần xác nhận yêu cầu bật lại. Sau thao tác được duyệt, kiểm tra guest khởi động và dịch vụ khách sử dụng.',
    probes: {
      P1: probe('Đọc trạng thái bật/tắt của máy ảo.', 'Máy đang tắt sẽ không trả lời SSH hay HTTP dù cấu hình dịch vụ không đổi.', 'Powered Off cho biết máy ảo đã tắt; chưa nói vì sao hoặc ai tắt.'),
      P2: probe('Đọc sự kiện shutdown trong panel.', 'Cần biết mất kết nối có trùng với một yêu cầu tắt máy không.', 'Panel ghi user requested shutdown lúc 12:30; cần audit để xác định tài khoản gửi yêu cầu.'),
      G1: probe('Đối chiếu tài khoản và mã yêu cầu shutdown.', 'Phân biệt thao tác của owner với sự cố ngoài ý muốn trước khi bật máy.', 'Yêu cầu act-731 gắn với account-owner; vẫn cần owner xác nhận mong muốn hiện tại.'),
    },
    questions: {
      triage: question('Khi khách nói VPS không phản hồi, điều nào đã biết từ lời báo?', 'Không phản hồi là triệu chứng; trạng thái nguồn và lý do mất kết nối phải được kiểm tra riêng.', {
        symptom: ['VPS không phản hồi khi truy cập qua mạng.', 'Đây là điều khách quan sát được; chưa phân biệt máy tắt với lỗi đường mạng.'],
        other: ['Chỉ website lỗi 403 còn SSH vẫn dùng được.', 'Khách không báo một dịch vụ riêng lẻ hoặc xác nhận SSH vẫn hoạt động.'],
        cause: ['Máy chủ vật lý đã hỏng nên VPS mất kết nối.', 'Mất kết nối cũng có thể do shutdown có chủ đích; lời báo chưa chứng minh lỗi host.'],
      }),
      check: question('Muốn biết VPS có đang bật, xem mục nào trước?', 'Trạng thái máy ảo ở panel trả lời câu hỏi nguồn điện; DNS và dung lượng guest không thay thế được phép kiểm tra này.', {
        direct: ['PANEL: VM state', 'Mục này cho biết VM đang Powered Off hay Running.'],
        wrong1: ['PANEL: event log', 'Lịch sử sự kiện cho biết thao tác trước đó, không thay trạng thái nguồn hiện tại.'],
        wrong2: ['PANEL: host health', 'Host health không cho biết VM cụ thể đang Powered Off hay Running.'],
      }),
      output: question('Powered Off cùng sự kiện user requested shutdown cho phép nhận định nào?', 'Hai quan sát phù hợp với một yêu cầu shutdown; chưa có bằng chứng rằng host tự tắt hoặc hỏng.', {
        supported: ['VM đang tắt; xác minh yêu cầu bật lại.', 'Powered Off và event shutdown khớp nhau, còn ý định bật lại cần owner xác nhận.'],
        over: ['Provider đã tự ý tắt VPS của khách.', 'Event ghi yêu cầu từ user, không phải bằng chứng provider tự tắt.'],
        ignore: ['Không phản hồi chứng minh guest đang treo dù panel báo tắt.', 'Trạng thái tắt đã giải thích việc không phản hồi; chưa có dữ liệu về guest treo.'],
      }),
      evidence: question('Chọn hai điều được trạng thái nguồn và event log ghi nhận.', 'Power state mô tả hiện tại; event log bổ sung sự kiện trước đó, chưa xác nhận ý định của owner.', {
        p1: ['Panel hiển thị Powered Off.', 'Đây là trạng thái máy ảo được panel ghi nhận.'],
        p2: ['Có yêu cầu shutdown lúc 12:30.', 'Event log có thời điểm và loại yêu cầu shutdown.'],
        over: ['Host đã gặp sự cố phần cứng.', 'Không có cảnh báo host hoặc lỗi phần cứng trong hai mục được hỏi.'],
      }),
      decision: question('Audit chỉ ra account-owner đã shutdown. Nên xử lý yêu cầu bật lại thế nào?', 'Tắt có chủ đích không phải giấy phép cho support bật lại; cần xác nhận owner và kiểm tra dịch vụ sau start.', {
        safe: ['Owner xác nhận; đội có quyền bật máy.', 'Xác minh người yêu cầu tránh bật máy đang được tắt có chủ đích hoặc bảo trì.'],
        unsafe: ['Tự bật hoặc reinstall để khôi phục kết nối.', 'Start cần đúng quyền; reinstall còn có thể ghi đè dữ liệu và không cần thiết ở đây.'],
        close: ['Đóng ticket vì đã tìm được sự kiện shutdown.', 'Khách vẫn chưa sử dụng được VPS; cần làm rõ yêu cầu bật lại và xác minh kết quả.'],
      }),
    },
    review: { technical: 'Phân biệt nguồn VM, event và ý định owner; panel snapshot không đồng nghĩa hardware failure.', editorial: 'Viết lại 5 câu, 15 lựa chọn; bổ sung diễn giải khách và ngữ cảnh từng phép đọc.', references: [refs.libvirt], fixtureChanges: [] },
  },
  'VPS-07-005': {
    answerOverrides: answer('Chứng chỉ endpoint gửi theo SNI đã hết hạn: notAfter 01/09/2026, trong khi máy kiểm tra ở 22/10/2026 UTC. Panel có cert mới nhưng chưa deploy.', 'Kiểm tra SAN, chain, vhost và đường dẫn cert; đối chiếu renewal job với trạng thái deployment.', 'Owner/admin triển khai cert đúng hostname theo quy trình được duyệt, kiểm tra cấu hình trước reload và giữ khả năng quay lại cấu hình trước.', 'Kết nối lại từ client với đúng SNI; kiểm tra cert còn hạn, chain hợp lệ, hostname được bao phủ và trang trả đúng nội dung.', 'Chuyển owner TLS/CA nếu thiếu quyền cert hoặc private key, renewal thất bại hay nhiều endpoint trả cert không đồng nhất.', 'Không tắt TLS verification, gửi private key qua ticket hoặc reload cấu hình chưa kiểm tra.'),
    customerExplanation: 'Trình duyệt báo chứng chỉ HTTPS đã hết hạn. Cần kiểm tra chứng chỉ mà máy khách thực sự nhận từ đúng hostname.',
    hints: ['Chứng chỉ trong panel có thể khác chứng chỉ endpoint đang phục vụ.', 'So notAfter của chứng chỉ theo đúng SNI với thời gian UTC của máy kiểm tra.', 'Nếu cert mới đã có nhưng chưa deploy, kiểm tra vhost và quy trình cài cert; không bỏ qua cảnh báo TLS.'],
    verificationPrompt: 'Ghi hostname/SNI, ngày hết hạn và thời gian kiểm tra. Nêu cách triển khai chứng chỉ được duyệt, rồi xác minh SAN, chain và HTTPS từ client.',
    probes: {
      P1: probe('Đọc ngày hiệu lực của chứng chỉ được endpoint gửi.', 'Trình duyệt có thể nhận cert cũ dù panel đã gia hạn cert mới.', 'notAfter là 01/09/2026 UTC; riêng ngày này phải so với thời gian kiểm tra và đúng hostname.', 'notBefore=Jun  3 00:00:00 2026 GMT\nnotAfter=Sep  1 00:00:00 2026 GMT'),
      P2: { ...probe('Đọc giờ UTC của máy kiểm tra.', 'Sai giờ client có thể gây cảnh báo chứng chỉ, nên cần một mốc để so sánh.', 'Ngày 22/10/2026 đã sau notAfter 01/09/2026; chứng chỉ đang phục vụ đã hết hạn tại mốc này.'), commandId: 'date-utc' },
      G1: probe('Xem cert mới đã được cài vào Nginx chưa.', 'Cần phân biệt gia hạn thành công với triển khai thành công.', 'Cert mới có sẵn nhưng deployed to Nginx:no; client vẫn có thể nhận cert cũ.'),
      G2: probe('Đọc trạng thái Nginx.', 'Web server có thể vẫn phục vụ HTTPS bằng cert cũ trong khi service active.', 'Nginx active chỉ xác nhận process service, không xác nhận cert đang dùng đã được cập nhật.'),
    },
    questions: {
      triage: question('Cảnh báo trình duyệt trong ticket liên quan đến phần nào của HTTPS?', 'Cảnh báo hết hạn thuộc quá trình kiểm tra chứng chỉ, không tự chứng minh lỗi backend HTTP.', {
        symptom: ['Trình duyệt báo chứng chỉ HTTPS hết hạn.', 'Khách thấy cảnh báo thời hạn cert khi truy cập website.'],
        other: ['Backend trả 502 sau khi TLS đã hợp lệ.', 'Khách báo certificate expired, không phải một HTTP502 đã được đo.'],
        cause: ['Cert đã gia hạn nên trình duyệt chắc chắn báo sai.', 'Gia hạn trong panel chưa chứng minh endpoint đã phục vụ cert mới.'],
      }),
      check: question('Làm sao đọc ngày hết hạn của cert mà example.com:443 thực sự gửi?', 'Kết nối tới 443 với đúng SNI rồi đọc cert được gửi; ngày trong inventory không thay thế kết quả từ endpoint.', {
        direct: ['echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -dates', 's_client lấy cert theo SNI; x509-dates in notBefore và notAfter.'],
        wrong1: ['openssl x509 -in /etc/nginx/tls.crt -noout -dates', 'Đọc file cert trên guest, chưa xác nhận endpoint theo SNI đang gửi chính file đó.'],
        wrong2: ['PANEL: certificate inventory', 'Inventory cho biết cert đã cấp, không xác nhận cert đang được client nhận.'],
      }),
      output: question('Cert hết hạn 01/09 nhưng client kiểm tra ngày 22/10; panel có cert mới chưa deploy. Kết luận nào đúng?', 'So thời gian xác nhận cert đang phục vụ đã hết hạn; trạng thái chưa deploy giải thích vì sao gia hạn chưa có tác dụng tại endpoint.', {
        supported: ['Endpoint còn phục vụ cert hết hạn; cần kiểm tra deployment và vhost.', 'Ngày kiểm tra sau notAfter, và inventory ghi cert mới chưa cài vào Nginx.'],
        over: ['Có cert mới trong panel nghĩa là mọi client đã nhận cert mới.', 'Inventory không phản ánh chắc chắn cert được load ở từng vhost/endpoint.'],
        ignore: ['Nginx active đủ để bỏ qua cảnh báo thời hạn cert.', 'Service đang chạy vẫn có thể dùng cert đã hết hạn.'],
      }),
      evidence: question('Chọn hai dữ kiện dùng để xác định cert nhận được đã quá hạn.', 'Cần cả hạn của cert được gửi và mốc thời gian kiểm tra; không chỉ trạng thái service hay inventory.', {
        p1: ['Cert từ endpoint có notAfter 01/09/2026 UTC.', 'Giá trị này được openssl x509 đọc từ cert nhận qua TLS.'],
        p2: ['Máy kiểm tra đang ở 22/10/2026 UTC.', 'Mốc UTC này nằm sau ngày hết hạn đã đọc.'],
        over: ['Client chắc chắn đã dùng cert mới trong panel.', 'Mục deployed:no và cert nhận được đều không hỗ trợ nhận định này.'],
      }),
      decision: question('Nên sửa cảnh báo hết hạn mà vẫn giữ xác thực TLS như thế nào?', 'Cần đúng cert, đúng hostname/vhost và quyền triển khai; sau reload phải hỏi lại endpoint để kiểm tra cert thực được phục vụ.', {
        safe: ['Kiểm tra SAN/chain rồi triển khai cert mới theo change được duyệt.', 'Giữ rollback và thử lại từ client để xác nhận deployment thực sự có hiệu lực.'],
        unsafe: ['Bỏ kiểm tra TLS ở client hoặc cài cert không kiểm tra hostname.', 'Cách này có thể che lỗi xác thực server và tạo rủi ro kết nối tới sai host.'],
        close: ['Đóng ticket vì Nginx active và panel đã có cert mới.', 'Khách vẫn nhận cert hết hạn; chưa kiểm chứng kết quả sau triển khai.'],
      }),
      order: question('Sắp xếp các bước thay cert HTTPS mà không bỏ qua kiểm tra endpoint.', 'Đọc cert đang phục vụ trước, triển khai có kiểm soát sau, rồi xác minh lại từ phía client.', {
        evidence: ['Đọc cert theo SNI, giờ UTC và tình trạng deployment.', 'Biết đúng cert đang phục vụ và mốc thời gian trước khi chọn cert thay thế.'],
        act: ['Cài cert đúng SAN/chain vào vhost và reload theo phê duyệt.', 'Deployment cần quyền, kiểm tra cấu hình và rollback trước reload.'],
        verify: ['Kết nối lại từ client: cert còn hạn, chain hợp lệ, site trả đúng.', 'Cert mới trong panel chưa đủ; phải kiểm tra kết quả TLS và nội dung website.'],
      }),
    },
    review: { technical: 'openssl x509-dates phải có cả notBefore/notAfter; so sánh mốc UTC; service active không xác minh cert deployment.', editorial: 'Bỏ thuật ngữ nội bộ trong 6 câu và ghi rõ SNI/deployment.', references: [refs.openssl, 'https://docs.openssl.org/3.0/man1/openssl-x509/'], fixtureChanges: [{probeId:'P1',reason:'Lệnh x509-noout-dates in cả notBefore và notAfter, thay fragment thiếu dòng đầu.',reference:'https://docs.openssl.org/3.0/man1/openssl-x509/'}] },
  },
  'VPS-08-003': {
    answerOverrides: answer('Resolver vẫn trả old-dns, còn zone được sửa nằm ở new-dns. Tác vụ registrar bổ sung xác nhận delegation vẫn ở old-dns; vì vậy chỉnh zone mới chưa làm resolver dùng zone đó.', 'Đối chiếu delegation ở registrar và truy vấn trực tiếp các authoritative NS; kiểm tra record mong muốn ở cả nơi cũ và mới.', 'Chủ domain phê duyệt thay delegation hoặc chỉnh đúng zone đang có thẩm quyền. Giữ dịch vụ DNS cũ trong quá trình cache chuyển tiếp khi còn cần.', 'Kiểm tra delegation, authoritative answer và resolver client riêng; theo dõi TTL thay vì khẳng định mọi người dùng cập nhật cùng lúc.', 'Chuyển registrar/DNS owner nếu không có quyền domain, delegation không đúng hoặc các authoritative NS trả dữ liệu bất nhất.', 'Không xóa zone cũ để ép client đổi NS; việc đó có thể gây lỗi cho resolver còn dùng delegation cũ.'),
    customerExplanation: 'Khách vừa sửa DNS trong panel nhưng người dùng vẫn nhận IP cũ. Cần biết tên miền đang ủy quyền cho nameserver nào, rồi mới đánh giá cache.',
    hints: ['Sửa một zone không tự đổi nameserver được domain sử dụng.', 'So kết quả NS với zone vừa sửa, rồi kiểm tra delegation ở registrar.', 'Hỏi trực tiếp nameserver mới để biết dữ liệu của zone đó; chỉ đổi delegation khi chủ domain duyệt.'],
    verificationPrompt: 'Ghi NS đang được trả về, zone khách sửa và delegation ở registrar. Nêu cách đối chiếu authoritative answer với resolver client sau thay đổi có quyền.',
    probes: {
      P1: probe('Hỏi bản ghi NS của example.test từ resolver hiện tại.', 'Muốn biết người dùng đang được dẫn tới nhóm nameserver nào.', 'Câu trả lời hiện liệt kê ns1/ns2.old-dns; một resolver vẫn có thể đang dùng cache.', ';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 40318\n;; ANSWER SECTION:\nexample.test. 300 IN NS ns1.old-dns.example.\nexample.test. 300 IN NS ns2.old-dns.example.'),
      P2: probe('Xem zone khách vừa sửa nằm ở nameserver nào.', 'Cần so nơi được chỉnh với nơi tên miền đang sử dụng.', 'Panel ghi zone tại new-dns; đây chưa phải xác nhận rằng registrar đã đổi delegation.'),
      G1: probe('Đọc delegation domain tại registrar.', 'Bản ghi NS ở resolver có thể cũ; cần nguồn quản lý delegation để đối chiếu.', 'Registrar còn ghi old-dns; việc chỉnh zone new-dns không tự đưa truy vấn người dùng sang đó.'),
      G2: probe('Hỏi trực tiếp A record từ nameserver mới.', 'Kiểm tra zone mới có IP mong muốn trước khi thay delegation.', 'new-dns trả 198.51.100.20; chưa chứng minh resolver client đang hỏi new-dns.'),
    },
    questions: {
      triage: question('Sau khi chỉnh DNS trong panel, khách vẫn gặp vấn đề gì?', 'Triệu chứng là người dùng còn thấy IP cũ; chưa biết nguyên nhân nằm ở delegation, zone hay cache.', {
        old: ['Người dùng chưa nhận IP mới.', 'Đây là kết quả khách muốn khắc phục sau thay đổi DNS.'],
        ssh: ['SSH từ chối xác thực.', 'Permission denied không phải hiện tượng khách báo trong ticket DNS này.'],
        disk: ['Filesystem không còn chỗ ghi.', 'Ticket không có thông tin dung lượng filesystem.'],
      }),
      check: question('Lệnh nào hỏi tên nameserver hiện được resolver trả cho example.test?', 'Loại truy vấn NS dùng để đối chiếu nameserver; nó khác kiểm tra HTTP hoặc route của VPS.', {
        dig: ['dig example.test NS', 'Truy vấn loại NS trả nameserver của zone từ resolver được dùng.'],
        curl: ['curl -I http://localhost', 'curl hỏi HTTP của máy local; không cho biết domain ủy quyền DNS ở đâu.'],
        route: ['ip route', 'Bảng route của guest không chứa delegation của domain.'],
      }),
      output: question('Resolver trả old-dns, panel vừa sửa zone new-dns. Bạn nên hiểu sự khác biệt này thế nào?', 'Có hai nguồn khác nhau; cần delegation và truy vấn authoritative để phân biệt sửa nhầm nơi với cache chưa cập nhật.', {
        different: ['NS resolver và nơi chỉnh zone khác nhau; cần kiểm tra delegation.', 'Sự không khớp xác định lớp cần điều tra, chưa tự khẳng định trạng thái registrar.'],
        changed: ['Registrar chắc chắn đã chuyển sang new-dns.', 'Mục edited zone chỉ mô tả nơi được sửa, không phải cấu hình registrar.'],
        broken: ['Tất cả resolver đều hỏng vì chúng chưa trả IP mới.', 'Một câu trả lời NS cũ có thể phản ánh delegation hoặc cache hợp lệ.'],
      }),
      evidence: question('Chỉ từ kết quả hỏi NS và mục edited zone, chọn hai điều đã biết.', 'Câu hỏi này chỉ dùng hai nguồn đầu; trạng thái registrar phải được đọc bằng tác vụ delegation riêng.', {
        old: ['Resolver đang trả old-dns.', 'Câu trả lời NS hiện có ns1/ns2.old-dns.'],
        new: ['Zone vừa sửa nằm ở new-dns.', 'Đây là thông tin trong mục edited zone của panel.'],
        registrar: ['Hai nguồn này đã xác nhận delegation tại registrar.', 'Chúng chưa trực tiếp đọc registrar; cần tác vụ delegation để xác minh.'],
        a: ['A record tại old-dns và new-dns giống nhau.', 'Chưa có cặp A record từ cả hai nameserver để so sánh.'],
      }),
      decision: question('Làm gì trước khi bảo khách chỉ cần chờ cache hết hạn?', 'Chờ TTL có ích sau khi xác minh đúng delegation/zone; nếu vẫn sửa nơi chưa được ủy quyền thì chờ không sửa được vấn đề.', {
        verify: ['Đối chiếu registrar và authoritative answer; đổi delegation khi được duyệt.', 'Xác định đúng nơi domain dùng trước khi sửa hoặc đặt kỳ vọng về cache.'],
        delete: ['Xóa zone old-dns ngay để ép client dùng new-dns.', 'Xóa zone không chuyển delegation và có thể làm resolver còn dùng NS cũ bị lỗi.'],
        wait: ['Chỉ chờ propagation, không hỏi thêm nameserver nào.', 'Chưa biết cấu hình domain có trỏ tới zone vừa sửa hay không.'],
      }),
    },
    review: { technical: 'Giữ phân biệt resolver-cache, edited zone và registrar; evidence chỉ hỏi hai nguồn đầu để tránh mâu thuẫn khi đã đọc G1.', editorial: 'Rà pilot thủ công; bỏ P1/P2/fixture khỏi prompt và feedback.', references: [refs.dig], fixtureChanges: [{probeId:'P1',reason:'Dòng NS phân cách dấu chấm phẩy là mô tả, không phải dạng dig; thay bằng header và NS record có owner/type.'}] },
  },
  'VPS-09-007': {
    answerOverrides: answer('Auth log và last ghi nhận root đăng nhập thành công từ 203.0.113.77. IP không có trong inventory hiện tại; tính được phép và danh tính người dùng key chưa được xác minh.', 'Giữ timestamp, fingerprint, auth/audit và dữ liệu phiên; đối chiếu owner, bastion, automation và change record với security.', 'Chuyển security khẩn để đánh giá phạm vi và phê duyệt containment/key rotation theo quy trình ứng phó sự cố. Không tự kết luận attacker từ IP.', 'Security đối chiếu được các phiên và key, đánh giá persistence/phạm vi ảnh hưởng và theo dõi truy cập sau containment; logout không đủ chứng minh hệ thống sạch.', 'Chuyển security ngay với timeline, IP, fingerprint và dữ liệu đã bảo toàn; thông báo owner theo quy trình.', 'Không xóa log, tự wipe/reboot hoặc khóa đường quản trị duy nhất trước khi có kế hoạch bảo toàn chứng cứ và containment.'),
    customerExplanation: 'Khách thấy một lần đăng nhập root thành công từ IP không nhận ra. Cần xác minh đây có phải quyền truy cập được duyệt và bảo toàn bằng chứng.',
    hints: ['Phân biệt Accepted với Failed password trước khi đánh giá mức ảnh hưởng.', 'Đối chiếu auth log, thời gian phiên và inventory truy cập được duyệt.', 'IP không nhận ra chưa xác định người thực hiện; chuyển security xác minh key, owner và phạm vi truy cập.'],
    verificationPrompt: 'Ghi IP, thời gian, cách xác thực và dữ liệu chưa xác minh. Nêu bước bảo toàn log, chuyển security và cách theo dõi containment được duyệt; không khẳng định hệ thống sạch chỉ vì phiên kết thúc.',
    probes: {
      P1: probe('Đọc sự kiện xác thực SSH của root.', 'Lần đăng nhập thành công có mức ảnh hưởng khác với thử mật khẩu thất bại.', 'Accepted publickey lúc 09:14 từ 203.0.113.77 cho biết key đã được chấp nhận; chưa xác định actor có được phép.', 'Oct 22 09:14:20 vps sshd[3104]: Accepted publickey for root from 203.0.113.77 port 51144 ssh2: ED25519 SHA256:uXzRs1YoPvjS/9wVRD4Zf1uTj3PseKqFLu6q0HD1mOk'),
      P2: probe('Đọc các phiên đăng nhập được ghi trong wtmp.', 'Cần đối chiếu event SSH với phiên root và nguồn IP.', 'last có phiên root từ cùng IP lúc 09:14; không chứng minh danh tính hoặc mọi hành động trong phiên.'),
      G1: probe('Đọc SSH log trong cửa sổ thời gian cố định.', 'Giữ timestamp và fingerprint để security đối chiếu key; tránh chỉ dựa vào mốc today.', 'Event cùng fingerprint giúp nối timeline; fingerprint không phải private key và chưa nói ai dùng key.', 'Oct 22 09:14:20 vps sshd[3104]: Accepted publickey for root from 203.0.113.77 port 51144 ssh2: ED25519 SHA256:uXzRs1YoPvjS/9wVRD4Zf1uTj3PseKqFLu6q0HD1mOk'),
      G2: probe('So nguồn đăng nhập với inventory đã được duyệt.', 'Một IP có thể thuộc automation hoặc truy cập ngoài quyền; cần nguồn đối chiếu owner.', '203.0.113.77 không có trong inventory hiện tại; cần owner/security xác minh, không tự quy danh tính.'),
    },
    questions: {
      triage: question('Vì sao lần truy cập root khách báo cần được kiểm tra ngay?', 'Khách báo successful login, không chỉ thử mật khẩu; cần xác minh quyền và bảo toàn dữ liệu liên quan.', {
        symptom: ['Có đăng nhập root thành công từ IP khách chưa nhận ra.', 'Một phiên quyền root có thể ảnh hưởng rộng nên cần xác minh authorization.'],
        other: ['Chỉ có lần thử mật khẩu thất bại cho user không tồn tại.', 'Failed login khác Accepted publickey và không mô tả điều khách đang hỏi.'],
        cause: ['Đã biết chính xác người tấn công từ địa chỉ IP.', 'IP nguồn không đủ gán danh tính và chưa biết đây có phải automation được duyệt.'],
      }),
      check: question('Muốn đọc lần SSH chấp nhận key cho root, bắt đầu bằng phép kiểm tra nào?', 'Ở CentOS Stream 9, log unit sshd ghi sự kiện xác thực; Ubuntu thường dùng unit ssh và phải chọn đúng môi trường.', {
        direct: ['journalctl -u sshd --since today', 'Đọc log sshd trong ngày để tìm Accepted, user, IP và timestamp.'],
        wrong1: ['df -h /', 'Dung lượng ổ đĩa không cho biết key nào vừa được SSH chấp nhận.'],
        wrong2: ['dig example.com A', 'DNS của website không xác minh một phiên SSH root.'],
      }),
      output: question('Auth log và last cùng ghi root từ .77, còn inventory không có IP này. Kết luận nào đủ căn cứ?', 'Đã có truy cập thành công và thiếu đối chiếu quyền; cần security xác minh, chưa thể kết luận actor hay phạm vi xâm nhập.', {
        supported: ['Root đã đăng nhập từ .77; quyền truy cập chưa xác minh, cần chuyển security.', 'Hai nguồn khớp sự kiện, nhưng inventory và log chưa xác nhận người/key có được phê duyệt.'],
        over: ['Đã biết kẻ tấn công và hệ thống sẽ sạch khi logout.', 'IP không định danh actor; kết thúc phiên không loại bỏ key, persistence hay hành động trước đó.'],
        ignore: ['Accepted publickey chỉ là lần thử key thất bại.', 'Accepted là xác thực đã được chấp nhận, khác Failed publickey.'],
      }),
      evidence: question('Chọn hai quan sát xác nhận đã có phiên root từ 203.0.113.77.', 'Hai nguồn khớp hỗ trợ sự kiện truy cập, không thay cho điều tra ai thực hiện và làm gì.', {
        p1: ['sshd ghi Accepted publickey cho root từ .77.', 'Auth log ghi cách xác thực, user và địa chỉ nguồn.'],
        p2: ['last liệt kê phiên root từ cùng IP lúc 09:14.', 'Dữ liệu phiên củng cố timeline trong auth log.'],
        over: ['Log đã xác nhận danh tính attacker và không còn rủi ro.', 'Chưa đối chiếu key/owner hay hoạt động sau đăng nhập.'],
      }),
      decision: question('Support nên làm gì khi owner chưa nhận ra phiên root này?', 'Ưu tiên giữ auth/audit và chuyển security; containment cần đúng phạm vi, quyền và bảo toàn chứng cứ.', {
        safe: ['Giữ log, xác minh owner/automation và chuyển security điều phối containment.', 'Đội security cần timeline, key và dữ liệu phiên để xử lý truy cập có thể trái phép.'],
        unsafe: ['Xóa log rồi reboot hoặc khóa root ngay theo phỏng đoán.', 'Mất chứng cứ hoặc mất đường quản trị có thể cản điều tra và gây gián đoạn.'],
        close: ['Đóng ticket khi IP ngừng kết nối, không cần xem key.', 'Phiên kết thúc không chứng minh key/persistence đã được xử lý.'],
      }),
      order: question('Sắp xếp việc xử lý phiên root chưa được xác minh quyền.', 'Bảo toàn sự kiện trước khi can thiệp; security xử lý theo quyền rồi tiếp tục kiểm tra phạm vi và truy cập.', {
        evidence: ['Giữ auth/audit và đối chiếu IP, thời gian, key với owner.', 'Can thiệp trước khi giữ dữ liệu có thể làm mất chứng cứ cần điều tra.'],
        act: ['Security phê duyệt containment và thay key theo kế hoạch.', 'Containment phải bảo vệ khách và duy trì đường quản trị cần thiết.'],
        verify: ['Theo dõi access mới và xác minh phạm vi ảnh hưởng với security.', 'Không có phiên mới là một tín hiệu; kết luận sạch vẫn cần điều tra phạm vi.'],
      }),
    },
    review: { technical: 'Phân biệt Accepted với failed; last không xác thực actor. Thay fingerprint rút gọn bằng dạng SHA256 hợp lệ 43 ký tự.', editorial: 'Viết rõ uncertain authorization và bảo toàn chứng cứ, không quy danh tính từ IP.', references: [refs.ssh, refs.systemd], fixtureChanges: [{probeId:'P1',reason:'Fingerprint mẫu ban đầu quá ngắn so với SHA256 fingerprint OpenSSH; thay chuỗi mẫu 43 ký tự.'},{probeId:'G1',reason:'Đồng bộ fingerprint cùng sự kiện ở cửa sổ log cố định.'}] },
  },
  'VPS-10-005': {
    answerOverrides: answer('Data disk không có trong guest và domblklist. Inventory còn vol-72 available; task migration ghi attach skipped. Điều này chỉ ra attachment còn thiếu, chưa chứng minh volume bị xóa hoặc dữ liệu nguyên vẹn.', 'Đối chiếu VM ID, volume ID, snapshot, lịch sử attachment và mapping host; xác nhận app không ghi vào thư mục thay thế trên OS disk.', 'Chuyển đội storage/virtualization khôi phục attachment đúng volume qua change được duyệt, bảo toàn dữ liệu hiện tại và kiểm tra integrity.', 'Kiểm tra đúng volume ID, thiết bị, filesystem/mount /data và các bản ghi/chức năng ứng dụng; thấy vdb đơn thuần chưa đủ.', 'Chuyển storage/virtualization khi thiếu attachment, mapping không rõ hoặc integrity review chưa hoàn thành.', 'Không mkfs, tạo volume thay thế hay gắn một disk chỉ vì tên/path giống; có thể phá dữ liệu hoặc gắn nhầm volume.'),
    customerExplanation: 'Sau chuyển máy ảo sang node khác, ứng dụng không còn thấy volume dữ liệu. Cần so ổ đĩa guest nhìn thấy với attachment phía host.',
    hints: ['Không thấy volume trong guest chưa chứng minh dữ liệu đã bị xóa.', 'So lsblk với domblklist ở host, rồi tìm volume ID trong inventory.', 'Nếu task ghi attach skipped, chuyển đội virtualization/storage xử lý đúng volume; không format đường dẫn thay thế.'],
    verificationPrompt: 'Ghi thiết bị thiếu, volume ID và cảnh báo migration. Nêu dữ liệu cần gửi đội storage, điều kiện gắn lại và cách kiểm tra đúng mount/dữ liệu ứng dụng.',
    probes: {
      P1: probe('Liệt kê thiết bị block guest đang nhìn thấy.', 'Volume mất sau migration có thể chưa gắn ở host hoặc chưa được guest nhận.', 'Guest chỉ liệt kê vda 25G; không thấy thiết bị dữ liệu vdb trong lần đo.', 'NAME MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS\nvda  252:0    0  25G  0 disk'),
      P2: probe('Đọc disk attachment của vm-102 tại hypervisor.', 'Cần phân biệt host chưa gắn volume với guest chưa nhận thiết bị đã gắn.', 'domblklist chỉ có vda; không có attachment vdb, nhưng chưa chứng minh volume bị xóa.'),
      G1: probe('Tìm volume dữ liệu theo ID trong inventory.', 'Không được gắn một volume chỉ vì tên/path tương tự; cần đúng ID và lịch sử attachment.', 'vol-72 còn trong inventory, trạng thái available; integrity vẫn pending nên chưa hứa dữ liệu nguyên vẹn.'),
      G2: probe('Đọc kết quả bước storage trong migration.', 'Liên hệ thời điểm mất volume với task chuyển node.', 'Task 08:00 ghi attach vol-72 bị skip; cần đội host xác minh và khôi phục attachment theo quyền.'),
    },
    questions: {
      triage: question('Ứng dụng mất volume sau migration: triệu chứng nào cần khoanh trước?', 'Khách báo thiếu thiết bị/dữ liệu sau chuyển node; phải xác định lớp attachment trước khi xử lý filesystem.', {
        symptom: ['Ứng dụng không thấy volume dữ liệu sau migration.', 'Đây là thay đổi quan sát được, chưa nói dữ liệu đã mất vĩnh viễn.'],
        other: ['Website chỉ dùng sai chứng chỉ TLS.', 'Cảnh báo cert không giải thích volume block biến mất khỏi guest.'],
        cause: ['Dữ liệu chắc chắn đã bị xóa trong migration.', 'Không thấy thiết bị cũng có thể do attachment bị bỏ qua.'],
      }),
      check: question('Trong guest, lệnh nào cho biết hiện có những block device nào?', 'lsblk liệt kê thiết bị ở guest; attachment ở hypervisor phải đọc bằng phép kiểm tra riêng.', {
        direct: ['lsblk', 'Đọc cây thiết bị block và kích thước guest nhận được.'],
        wrong1: ['dig example.com A', 'DNS không liệt kê volume của máy ảo.'],
        wrong2: ['systemctl restart nginx', 'Restart webservice là thay đổi; không kiểm tra attachment và không làm hiện disk bị thiếu.'],
      }),
      output: question('Guest chỉ thấy vda, host không có vdb và task ghi attach skipped. Bạn xác định được gì?', 'Attachment của data volume đã bị bỏ qua theo task; inventory còn volume nhưng phải kiểm tra đúng ID/integrity trước phục hồi.', {
        supported: ['Data volume chưa gắn vào VM; cần inventory và đội storage/virtualization.', 'Guest/host cùng thiếu vdb và task bổ sung bước attach skipped.'],
        over: ['Volume đã bị xóa vĩnh viễn nên không thể phục hồi.', 'Inventory còn vol-72 available; chưa có kết luận dữ liệu bị xóa.'],
        ignore: ['Chỉ cần mount /data vì host đã gắn vdb đầy đủ.', 'domblklist chưa có vdb; mount không tạo attachment.'],
      }),
      evidence: question('Chọn hai quan sát so sánh guest và host trong ca mất volume.', 'Thiếu ở cả hai lớp khác với trường hợp host có disk nhưng guest chưa nhận; chưa được suy ra dữ liệu bên trong.', {
        p1: ['lsblk trong guest chỉ liệt kê vda.', 'Không có vdb trong danh sách thiết bị được guest nhìn thấy.'],
        p2: ['domblklist của VM chỉ có attachment vda.', 'Host chưa liệt kê data disk cho VM này.'],
        over: ['Hai danh sách xác nhận data volume không còn tồn tại.', 'Danh sách thiết bị gắn vào VM không phải toàn bộ inventory storage.'],
      }),
      decision: question('Cách nào bảo vệ dữ liệu khi cần khôi phục attachment vol-72?', 'Cần đúng volume ID, kiểm tra snapshot và quyền đội host; tránh để app ghi vào thư mục /data trên disk OS thay thế.', {
        safe: ['Hạn chế ghi nhầm /data và chuyển đội storage gắn đúng volume có kiểm soát.', 'Giữ nguyên volume, đối chiếu ID/snapshot và phối hợp đúng đội có quyền host.'],
        unsafe: ['Tạo filesystem mới tại /data để app chạy lại.', 'Có thể ghi dữ liệu lên sai disk hoặc phá dữ liệu nếu thao tác nhầm volume.'],
        close: ['Đóng ticket ngay khi task migration báo Completed.', 'Task có warning và app còn thiếu volume; trạng thái Completed chưa giải quyết triệu chứng.'],
      }),
      order: question('Sắp xếp quy trình phục hồi data volume bị thiếu sau migration.', 'Xác định đúng thiết bị và inventory trước; gắn lại có quyền; sau đó kiểm tra mount, dữ liệu và app.', {
        evidence: ['So guest/host, volume ID và cảnh báo task migration.', 'Danh sách attachment và inventory giúp tránh gắn nhầm volume.'],
        act: ['Đội host khôi phục attachment đúng ID theo change được duyệt.', 'Chỉ đội có quyền mới thao tác storage; không format để thử.'],
        verify: ['Kiểm tra đúng volume, mount /data và dữ liệu ứng dụng.', 'Thiết bị hiện lại mới là bước đầu; phải kiểm chứng dữ liệu và chức năng app.'],
      }),
    },
    review: { technical: 'lsblk phải là bảng thiết bị; domblklist thiếu vdb không đồng nghĩa disk deleted; bảo vệ đúng ID và dữ liệu.', editorial: 'Câu hỏi phân biệt attachment, thiết bị và integrity, không dùng thuật ngữ nội bộ.', references: [refs.libvirt,'https://man7.org/linux/man-pages/man8/lsblk.8.html'], fixtureChanges: [{probeId:'P1',reason:'Source vda 25G only là mô tả tiếng Anh, thay bằng bảng NAME/SIZE/TYPE lsblk tối thiểu.'},{probeId:'P2',reason:'Guided base fixture thay chú thích (no vdb) trong source bằng bảng virsh domblklist chỉ có vda.'}] },
  },
}

Object.assign(topicEdits, {
  'VPS-10-001': {
    customerExplanation: 'Sau sự cố node, panel báo VPS không chạy. Cần kiểm tra trạng thái host và điều kiện an toàn trước khi bật lại.',
    hints: ['VM tắt không tự chứng minh dữ liệu hỏng.', 'So state trong panel với domstate trên host.', 'Storage consistency review còn pending; hỏi đội incident trước start có quyền.'],
    verificationPrompt: 'Ghi state panel/host và trạng thái incident. Nêu quyền bật lại, điều kiện storage và cách kiểm tra guest cùng dịch vụ sau đó.',
    probes: {
      P1: probe('Đọc VM status trong panel.', 'Xác nhận điều khách thấy sau outage.', 'Panel ghi Stopped; chưa cho biết lý do hoặc mức an toàn khi bật lại.'),
      P2: probe('Đọc VM state từ hypervisor.', 'Đối chiếu panel với nguồn quản lý host.', 'shut off xác nhận host cũng thấy VM tắt; không kiểm tra dữ liệu guest.'),
      G1: probe('Đọc incident node và storage review.', 'Start sau outage cần biết storage đã được cho phép sử dụng chưa.', 'INC-410 còn chờ consistency review; chưa đủ điều kiện hứa khôi phục an toàn.'),
    },
    questions: {
      triage: question('Khách đang gặp trạng thái nào sau outage?', 'VM không chạy là triệu chứng; lý do và dữ liệu bên trong cần kiểm tra riêng.', {symptom:['Panel báo VPS không chạy.','Cần đối chiếu host và incident liên quan.'],other:['Guest vẫn SSH được từ mọi nguồn.','Lời khách không xác nhận truy cập còn hoạt động.'],cause:['Outage chứng minh dữ liệu đã hỏng.','Cần kiểm tra storage và filesystem, không suy từ một sự cố node.']}),
      check: question('Trong panel, mục nào đọc trực tiếp trạng thái VM?', 'Panel state và host state cần đối chiếu nhưng là hai nguồn riêng.', {direct:['PANEL: VM status','Mục này cho trạng thái VM theo panel.'],wrong1:['PANEL: outage incident','Incident bổ sung bối cảnh, không thay VM status.'],wrong2:['virsh domstate vm-102','Đây là phép đọc host, không phải mục panel đang hỏi.']}),
      output: question('Panel Stopped, host shut off, storage review pending: kết luận nào đủ?', 'State tắt khớp giữa hai nguồn; quyền và điều kiện start vẫn cần incident review.', {supported:['VM đã tắt; cần review trước start.','Chưa biết nguyên nhân và storage consistency sau outage.'],over:['Dữ liệu chắc chắn hỏng do outage.','Không có kết quả kiểm tra dữ liệu để khẳng định.'],ignore:['State khớp nghĩa là start luôn an toàn.','Tình trạng storage vẫn đang được đánh giá.']}),
      evidence: question('Chọn hai state được panel và host ghi nhận.', 'Hai nguồn khớp state không kiểm tra integrity.', {p1:['Panel ghi Stopped.','Đây là trạng thái panel hiện thấy.'],p2:['Host trả shut off.','Hypervisor cũng thấy VM đang tắt.'],over:['Guest filesystem đã được xác nhận hỏng.','Chưa có filesystem hoặc data check.']}),
      decision: question('Cần làm gì trước khi khôi phục VM sau outage?', 'Đúng đội đánh giá host/storage rồi quyết định start có quyền; không thử lặp các hành động.', {safe:['So incident và xin start có kiểm soát.','Owner và đội ảo hóa xác nhận node/storage đủ điều kiện.'],unsafe:['Start liên tục hoặc rollback snapshot ngay.','Có thể tăng rủi ro và ghi đè dữ liệu chưa được bảo toàn.'],close:['Đóng ticket khi hai nguồn cùng báo tắt.','Khách vẫn chưa sử dụng được VPS.']}),
    },
    answerOverrides: answer('Panel Stopped và host shut off cùng xác nhận VM tắt. INC-410 còn chờ storage consistency review; chưa đánh giá được dữ liệu hoặc điều kiện bật lại.', 'Đọc event/incident, lịch shutdown và node/storage health; xác nhận VM ID và owner yêu cầu khôi phục.', 'Đội ảo hóa start có kiểm soát khi được phép và host/storage đã được xác nhận; giữ kế hoạch recovery phù hợp.', 'Guest boot xong, volume đúng và dịch vụ khách hoạt động từ client; theo dõi dấu hiệu lỗi dữ liệu sau outage.', 'Chuyển host/storage nếu review còn pending, VM tắt lặp lại hoặc boot lỗi.', 'Không start lặp hoặc rollback snapshot để thử khi chưa rõ storage state và dữ liệu có thể bị ghi đè.'),
    review: {technical:'Đã đối chiếu panel/host state và giới hạn integrity; start phụ thuộc incident review.',editorial:'Tách trạng thái nguồn khỏi nguyên nhân, quyền và kết quả phục hồi.',references:[refs.libvirt],fixtureChanges:[]},
  },
  'VPS-10-002': {
    customerExplanation: 'Guest boot sau migration nhưng chỉ thấy loopback. Cần so interface guest với vNIC được cấu hình ở host.',
    hints: ['Thiếu NIC khác với có NIC nhưng thiếu default route.', 'So ip link với vNIC inventory và MAC dự kiến.', 'Host team phải kiểm tra attachment; tạo bridge trong guest không thay thế vNIC còn thiếu.'],
    verificationPrompt: 'Ghi interface guest, vNIC state và MAC/network dự kiến. Nêu đội có quyền attachment và các kiểm tra IP/route/client sau sửa.',
    probes: {
      P1: probe('Liệt kê interface mà guest nhìn thấy.', 'Cần biết guest có nhận NIC ngoài loopback sau migration không.', 'Chỉ có lo trong mẫu; chưa phân biệt host thiếu attachment với driver/device discovery.', 'lo UNKNOWN 00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>'),
      P2: probe('Đọc vNIC gắn cho VM trong panel.', 'So cấu hình host với thiết bị guest nhận được.', 'Panel không có virtual NIC attached; cần đối chiếu cấu hình host và task migration.'),
      G1: probe('Đọc NIC/MAC/network dự kiến của VM.', 'Gắn lại phải đúng network và MAC được cấp, không chọn một bridge bất kỳ.', 'Inventory yêu cầu một NIC, MAC52:54:00:ab:10:02 trên br-public; chưa chứng minh attachment đã phục hồi.'),
    },
    questions: {
      triage: question('Guest chỉ thấy loopback sau migration cần khoanh điều gì?', 'Kiểm tra thiết bị trước cấu hình IP/route trên một NIC chưa xuất hiện.', {symptom:['Guest chỉ thấy interface loopback.','Chưa có NIC ngoài lo trong mẫu hiện tại.'],other:['Chỉ SMTP outbound bị policy chặn.','Không giải thích việc thiếu interface ở guest.'],cause:['NetworkManager chắc chắn đã hỏng.','Host attachment hoặc guest driver cũng có thể liên quan.']}),
      check: question('Lệnh nào liệt kê link mà guest hiện nhìn thấy?', 'Guest link list khác host vNIC inventory và route.', {direct:['ip -br link','Đọc interface và link state trong guest.'],wrong1:['PANEL: vNIC list','Đọc attachment host, không phải thiết bị guest nhận.'],wrong2:['ip route','Route không liệt kê mọi interface kể cả chưa cấu hình IP.']}),
      output: question('Guest chỉ lo và panel không có vNIC. Hướng nào được hỗ trợ?', 'Hai lớp cùng cho thấy thiếu NIC/attachment; cần host config review trước đụng mạng guest.', {supported:['Điều tra attachment vNIC ở host.','Đối chiếu expected MAC/network rồi chuyển đội ảo hóa.'],over:['NetworkManager chắc chắn là nguyên nhân.','Không có vNIC ở panel nên chưa đủ quy lỗi dịch vụ guest.'],ignore:['Chỉ thêm route là tạo được NIC.','Route không tạo virtual hardware đang thiếu.']}),
      evidence: question('Chọn hai quan sát từ guest và panel.', 'Thiết bị guest nhìn thấy và host attachment là hai nguồn đối chiếu.', {p1:['ip link chỉ liệt kê lo.','Không có NIC khác trong mẫu.'],p2:['Panel không liệt kê vNIC attached.','Cần host team kiểm tra cấu hình VM.'],over:['Đã chứng minh NetworkManager lỗi.','Chưa có state/log của NetworkManager để kết luận.']}),
      decision: question('Khôi phục NIC sau migration theo đúng phạm vi thế nào?', 'Đúng MAC/network và quyền host trước; sau đó mới kiểm tra IP/route guest.', {safe:['Chuyển host team với MAC/network dự kiến.','Đội có quyền khôi phục đúng attachment theo change.'],unsafe:['Tạo bridge guest để thay vNIC thiếu.','Guest bridge không tạo được NIC ảo ở hypervisor.'],close:['Đóng vì VM đã boot.','Khách vẫn thiếu NIC và kết nối.']}),
    },
    answerOverrides: answer('Guest chỉ có loopback và panel không có vNIC attached. Khả năng attachment thiếu được hỗ trợ; chưa xác định chi tiết lỗi migration hoặc guest driver.', 'So expected NIC/MAC/network, host domain config và task migration; kiểm tra device discovery nếu host đã gắn đúng.', 'Chuyển virtualization khôi phục vNIC đúng network theo change và quyền; không tạo NIC giả trong guest.', 'Guest thấy NIC, IP/route đúng cấp phát và kết nối client hoạt động; kiểm tra isolation/network đúng.', 'Chuyển hypervisor/network team vì cần quyền host và mapping mạng.', 'Không đoán bridge hoặc tạo interface trong guest để thay phần cứng ảo còn thiếu.'),
    review: {technical:'Phân biệt vNIC host, thiết bị guest và route; sửa ip-link output đủ trường thực tế.',editorial:'Câu hỏi về guest/host rõ ngữ cảnh, không quy lỗi NetworkManager sớm.',references:[refs.libvirt,'https://man7.org/linux/man-pages/man8/ip-link.8.html'],fixtureChanges:[{probeId:'P1',reason:'ip-br-link mặc định có link address/flags; bổ sung phần lo thực tế, không thêm NIC.'}]},
  },
  'VPS-10-003': {
    customerExplanation: 'VM có IP nhưng không tới gateway. Cần đối chiếu bridge host đang gắn với network được cấp cho VM.',
    hints: ['Có IP chưa bảo đảm NIC gắn đúng mạng phía host.', 'So domiflist với expected bridge và network allocation.', 'Sai khác bridge cần host/network review; không đổi IP hoặc firewall để thử.'],
    verificationPrompt: 'Ghi bridge thực, bridge/network được cấp và thông tin MAC/gateway. Nêu quyền sửa host và cách kiểm tra reachability cùng isolation.',
    probes: {
      P1: probe('Đọc interface attachment của VM ở host.', 'Guest IP có thể đúng nhưng NIC ở sai bridge/VLAN.', 'vnet4 gắn br-storage trong domain config; cần so network intent.', 'Interface Type Source Model MAC\n-------------------------------------------------------\nvnet4 bridge br-storage virtio 52:54:00:ab:10:02'),
      P2: probe('Đọc bridge được inventory yêu cầu.', 'Cần nguồn cấu hình mong muốn trước đổi attachment.', 'Expected bridge là br-public, khác br-storage đang thấy.'),
      G1: probe('Đọc network allocation gồm gateway.', 'Xác minh bridge đúng network chứ không chỉ trùng tên.', 'VM thuộc public-vlan-12/br-public với gateway198.51.100.1; cần host network team đối chiếu mapping.'),
    },
    questions: {
      triage: question('Khách gặp giới hạn kết nối nào dù VM đã có IP?', 'Phạm vi gateway hướng kiểm tra lớp link/network, chưa đủ quy guest firewall.', {symptom:['VM không tới gateway được cấp.','Cần đối chiếu NIC, route và host network.'],other:['Ứng dụng từ chối mật khẩu database.','Không mô tả lỗi tới gateway.'],cause:['Guest firewall chắc chắn chặn gateway.','Chưa có firewall evidence hoặc path test để định lớp chặn.']}),
      check: question('Phép nào đọc bridge host mà vNIC đang gắn?', 'Cấu hình host attachment khác route guest và inventory mong muốn.', {direct:['virsh domiflist vm-102','Đọc Source bridge của interface domain.'],wrong1:['ip route','Guest route không chỉ bridge host thực đang gắn.'],wrong2:['PANEL: expected bridge','Inventory mô tả intent, không xác minh actual attachment.']}),
      output: question('Actual br-storage, expected br-public: điều gì đã xác định?', 'Có mismatch attachment với intent; vẫn cần MAC/network mapping trước change.', {supported:['Host bridge không khớp inventory.','Chuyển đúng network/virtualization team xác minh mapping.'],over:['Guest firewall đã được chứng minh sai.','Bridge mismatch không đọc rule guest.'],ignore:['Cùng có bridge nghĩa là cùng mạng.','Bridge khác có thể thuộc VLAN/isolation khác nhau.']}),
      evidence: question('Chọn hai thông tin actual và expected bridge.', 'Không đánh đồng interface tồn tại với đúng mạng được cấp.', {p1:['vnet4 đang gắn br-storage.','domiflist liệt kê Source đó.'],p2:['Inventory yêu cầu br-public.','Đây là cấu hình mong muốn của VM.'],over:['Firewall guest chặn gateway đã xác nhận.','Chưa có dữ liệu guest firewall.']}),
      decision: question('Ai nên sửa attachment bridge và với dữ liệu gì?', 'Đội hạ tầng có quyền host, đúng MAC/network/gateway và console/rollback trước change.', {safe:['Gửi MAC/network/gateway cho đội host.','Đội network/ảo hóa sửa mapping có kiểm soát.'],unsafe:['Tự đổi bridge hoặc đoán IP guest.','Có thể cắt kết nối hoặc phá isolation và không sửa đúng intent.'],close:['Đóng vì guest vẫn có IP.','Có IP không giải quyết việc không tới gateway.']}),
    },
    answerOverrides: answer('Host interface gắn br-storage trong khi inventory yêu cầu br-public/public-vlan-12. Có mismatch cần network/virtualization review; chưa chứng minh guest firewall sai.', 'So MAC, VM XML, bridge/VLAN mapping và network/gateway cấp phát; giữ console trước change.', 'Đội host/network sửa attachment theo intent và change được duyệt, có rollback và kiểm tra isolation.', 'Guest tới gateway, đúng subnet/isolation và dịch vụ từ client hoạt động.', 'Chuyển host network/virtualization vì cần quyền bridge/VLAN và cấu hình domain.', 'Không tự chuyển bridge đang chạy hoặc đổi IP ngẫu nhiên để che mismatch host.'),
    review: {technical:'Actual/expected bridge phải gắn MAC/network intent; domiflist cần bảng đầy đủ.',editorial:'Tách host attachment, guest route và inventory trong câu hỏi.',references:[refs.libvirt],fixtureChanges:[{probeId:'P1',reason:'Dòng vnet4 bridge br-storage thiếu header/model/MAC; bổ sung bảng domiflist hợp lý, giữ source bridge.'}]},
  },
  'VPS-09-004': {
    customerExplanation:'Khách thấy account supportadmin không nhận ra. Cần xác minh nguồn tạo, quyền sudo và các lần sử dụng trước khi coi là account hợp lệ hoặc xóa.',
    hints:['Tên lạ không tự chứng minh compromise.','So account entry, sudo rule và change/useradd history.','Giữ bằng chứng rồi hỏi owner/security; chưa biết account đã login hay được duyệt.'],
    verificationPrompt:'Ghi account, quyền và creation event. Nêu approval/login evidence còn thiếu, đội nhận và cách xác minh access sau review.',
    probes:{P1:probe('Tra account supportadmin.','Xác nhận user khách thấy có trong nguồn danh tính không.','Account cóUID1002, home và shellbash; chưa nói ai tạo hoặc đã đăng nhập.'),P2:probe('Đọc sudoers drop-in liên quan account.','Tên account không cho biết mức đặc quyền thực.','Rule cho supportadmin sudo dưới user khác theo cấu hình; cần approval và effectivepolicy.'),G1:probe('Đọc sự kiện useradd theo thời gian.','Tìm timeline tạo account để so change record.','Có creation event21/10; chưa xác minh người phê duyệt hoặc mọi hoạt động sau đó.')},
    questions:{triage:question('Điều nào cần xác minh về account khách không nhận ra?', 'Sự tồn tại và quyền khác với tính được phép.',{symptom:['Có account admin khách không nhận ra.','Cần inventory/change và login evidence.'],other:['Website chỉ trả404 sau deploy.','Không phải vấn đề danh tính/đặc quyền đang báo.'],cause:['Tên lạ chứng minh attacker đã tạo.','Có thể là automation hoặc change hợp lệ cần xác minh.']}),check:question('Lệnh nào tra entry account supportadmin?', 'Đọc account database trước khi so quyền và lịch sử.',{direct:['getent passwd supportadmin','Tra user qua NSS/account database.'],wrong1:['grep -R supportadmin /etc/sudoers.d','Tra rule quyền, không xác nhận account entry hiện tại.'],wrong2:['last -n 10','Lịch sử phiên không thay cho tra account tồn tại.']}),output:question('Account có shell và sudo rule, nhưng chưa có approval. Nhận định nào đúng?', 'Quyền cao đã quan sát; tính hợp lệ vẫn cần change và owner/security review.',{supported:['Account có sudo, quyền chưa xác minh.','Không tự gán actor hoặc xóa account trước bảo toàn dữ liệu.'],over:['Tên lạ đủ cho phép xóa ngay.','Có thể cắt automation hợp lệ và mất chứng cứ.'],ignore:['Có entry nghĩa là account đã được duyệt.','Account database không chứa approval của owner.']}),evidence:question('Chọn hai quan sát từ account entry và sudoers.', 'Cả hai cho thông tin kỹ thuật, chưa xác nhận ai dùng account.',{p1:['supportadmin có entry và shellbash.','getent cho UID/GID/home/shell.'],p2:['Drop-in cấp sudo cho supportadmin.','Cần so effectivepolicy và approval.'],over:['Tên lạ đã xác nhận compromise.','Chưa có attribution hoặc change reconciliation.']}),decision:question('Nên xử lý account đặc quyền chưa rõ nguồn thế nào?', 'Giữ evidence, xác minh owner/change và chuyển security khi cần containment.',{safe:['Giữ bằng chứng, so change và chuyển security.','Tránh mất dữ liệu trước khi xác minh nguồn/quyền.'],unsafe:['Xóa account hoặc đổi toàn bộ password ngay.','Có thể phá công việc hợp lệ và cản điều tra.'],close:['Đóng vì account có trong passwd.','Có mặt không đồng nghĩa được phép.']})},
    answerOverrides:answer('supportadmin tồn tại với shell và sudo rule. Sự kiện useradd đã có, nhưng approval, nguồn tạo và lịch sử sử dụng chưa được xác minh.', 'Bảo toàn account/sudoers, creation/auth/sudo logs; đối chiếu owner, change record và automation.', 'Chuyển security đánh giá, chỉ hạn chế/thu hồi quyền theo incident runbook và approval phù hợp.', 'Nguồn account được giải thích, quyền hợp lệ được khôi phục hoặc containment được kiểm tra; rà phiên/key liên quan.', 'Chuyển security sớm khi owner không nhận, có sudo trái phép hoặc login bất thường.', 'Không xóa account trước giữ evidence; không coi tên lạ hoặc entry passwd là kết luận cuối.'),
    review:{technical:'Account tồn tại/sudo khác authorization, không suy actor từ tên.',editorial:'Quyền và provenance riêng.',references:[refs.ssh,'https://www.sudo.ws/docs/man/sudoers.man/'],fixtureChanges:[]},
  },
  'VPS-09-005': {
    customerExplanation:'Provider báo SMTP tăng bất thường từIP VPS. Cần nối notice với process/traffic, chưa thể kết luận mọi Python process là malware.',
    hints:['Notice không tự định danh process hoặc nội dung spam.','So IP/time với socket, PID, owner và mail logs.','Giữ evidence rồi phối hợp abuse/security containment; không xóa file để thử.'],
    verificationPrompt:'Ghi notice, socket/PID và traffic window. Nêu nội dung/authorization còn thiếu, đội nhận và cách xác minh containment cùng provider.',
    probes:{P1:probe('Đọc abuse notice của provider.','Cần đúng IP, loại traffic và thời gian cáo buộc.','Notice nêuSMTP spike từIP VPS, chưa xác định process hoặc maliciouscontent.'),P2:probe('Liệt kê socket và process sở hữu.','Nối traffic outbound với PID để điều tra đúng workload.','PythonPID1802 kết nốiTCP25; chưa chứng minh mail spam hoặc executable độc hại.','Netid State Recv-Q Send-Q Local Address:Port Peer Address:Port Process\ntcp ESTAB 0 0 198.51.100.20:45000 203.0.113.25:25 users:(("python3",pid=1802,fd=9))'),G1:probe('Đọc command line và owner của PID.','Cần định danh job hợp lệ hoặc khác thường trước can thiệp.','PID1802 chạy mail_worker.py dưới app; cần inventory/change/mail evidence.'),G2:probe('Đọc thống kê SMTP cùng cửa sổ notice.','Một socket đơn lẻ chưa mô tả spike.','1280 kết nối/15phút so baseline20; mức tăng chưa chứng minh nội dung spam.')},
    questions:{triage:question('Provider đang yêu cầu điều tra loại traffic nào?', 'SMTP spike là cáo buộc cần correlate, không phải verdict malware.',{symptom:['Traffic SMTP từIP VPS bị báo abuse.','Cần notice và thời gian/IP để điều tra.'],other:['Một client nhậnNXDOMAIN.','Không mô tả spike mail outbound.'],cause:['Python chắc chắn là malware.','Nhiều ứng dụng mail hợp lệ cũng dùngPython.']}),check:question('Muốn đọc chính IP/type traffic provider báo, xem gì?', 'Notice là nguồn yêu cầu abuse; socket bổ sung process local.',{direct:['PANEL: abuse notice','Đọc cáo buộc/IP từprovider.'],wrong1:['ss -tunap','Đọc socket hiện tại, không thay nội dung notice.'],wrong2:['ps -p 1802 -o pid,ppid,user,comm,args','Định danh process, chưa đọc phạm vi provider báo.']}),output:question('Notice, socket25 vàspike khớp thời gian. Nên hiểu mức nào?', 'Có traffic cần điều tra; chưa có nội dung/authorization đủ để quy malicious.',{supported:['Có SMTP spike cần review process/mail.','Correlate owner, logs và notice trước containment.'],over:['Python là malware và được xóa ngay.','Command line/socket không chứng minh ác ý.'],ignore:['Một socket mail chứng minh toàn bộ spike hợp lệ.','Chưa so nội dung, số lượng và policy.']}),evidence:question('Chọn hai quan sát từ notice và socket.', 'Chúng nối IP với một kết nối/PID, chưa giải thích toàn traffic.',{p1:['Provider báo SMTP spike từIP VPS.','Notice nêu loại traffic vànguồn.'],p2:['PID1802 có socket tớiTCP25.','ss liên kết một kết nối với process.'],over:['Đã chứng minh binary malicious.','Chưa kiểm tra executable/content/authorization.']}),decision:question('Làm gì để xử lý abuse mà giữ khả năng điều tra?', 'Bảo toàn notice/process/mail evidence rồi điều phối containment đúng quyền.',{safe:['Giữ evidence và phối hợp abuse/security.','Owner và policy quyết định containment, không kill mù.'],unsafe:['Kill/xóa process hoặc wipe VPS ngay.','Có thể mất evidence và gián đoạn công việc hợp lệ.'],close:['Đóng khi một socket biến mất.','Spike/nguồn traffic và yêu cầu provider chưa được xác minh.']}),order:question('Sắp xếp điều tra SMTP spike có process liên quan.', 'Evidence trước, containment có quyền, rồi đối chiếu provider và monitoring.',{evidence:['Nối notice với socket/process/mail logs.','Cần xác định source, thời gian và authorization.'],act:['Abuse/security duyệt containment cùng owner.','Không mở lại traffic hoặc xóa file trước đánh giá.'],verify:['Provider và monitoring xác nhận spike dừng.','Còn cần đánh giá nguyên nhân/phạm vi, không chỉ một socket.']})},
    answerOverrides:answer('Provider báoSMTP spike; socketTCP25 liên quanPythonPID1802 và thống kê tăng. Chưa đủ chứng minh spamcontent hoặc compromise.', 'Giữ notice, timestamps, socket, process ancestry, binary metadata và mail logs; đối chiếu owner/change.', 'Abuse/security điều phối containment theo policy với owner, bảo toàn evidence trước can thiệp.', 'Nguồn traffic được xác định, containment có hiệu lực, provider xác nhận yêu cầu abuse được xử lý và monitoring ổn.', 'Chuyển abuse/security; phối hợp app/mail owner khi cần nội dung hay quyền process.', 'Không kill/xóa process hoặc wipe VPS chỉ từ socket; không hứa sạch khi chưa đánh giá phạm vi.'),
    review:{technical:'SMTP socket/volume không chứng minh spam; sửa ssNetidcolumn.',editorial:'Traffic/process/intent tách rõ.',references:['https://man7.org/linux/man-pages/man8/ss.8.html'],fixtureChanges:[{probeId:'P2',reason:'ss-tunap có Netid khi chọnTCP/UDP; bổ sung header/tcp,giữ nguyên socket.'}]},
  },
  'VPS-09-006': {
    customerExplanation:'PublicIP không phản hồi giữa trafficspike. Panel báo mitigation vàupstreamnull-route, cần đội network/security đánh giá.',
    hints:['Guestfirewall không gỡ được null-route upstream.','So mốc mất kết nối,mitigation,route vàtrafficgraph.','Mitigationtrigger chưa chứng minh toàn traffic độc hại; gỡ phải theo providerpolicy.'],
    verificationPrompt:'Ghi mốc mitigation/null-route vàincident. Nêu trigger còn cần kiểmtra, quyền gỡ và cách thử lại từ nhiều nguồn.',
    probes:{P1:probe('Đọc thời điểm mitigation được kích hoạt.','Nối sự cố kết nối với hành động provider.','Triggered14:05 choIP.20; cần traffic/policy để đánh giá trigger.'),P2:probe('Đọc trạng thái route upstream.','Xác định khách có bị chặn trước guest không.','Null-route active14:06; guest không tự thay đổi trạng thái này.'),G1:probe('So lưu lượng với baseline vàpolicy.','Cần dữ liệu định lượng trước xem falsepositive/attack.','2.4Mpps so18kbaseline; chưa phân loại mọi gói hoặc xác nhận trigger đúng.'),G2:probe('Đọc owner củaincident mitigation.','Cần đúng đội có quyền provider/network để phối hợp.','NET-612 mở vànetworkoncall nhận; chưa phải incident resolved.')},
    questions:{triage:question('Khách gặp phạm vi lỗi nào trong trafficspike?', 'IP không phản hồi cần so đườngupstream, không mặc định một HTTPautherror.',{symptom:['PublicIP không phản hồi trongspike.','Cần timestamps và phạm vi nguồn bịảnh hưởng.'],other:['Chỉ ứng dụng trả401 Unauthorized.','401 là HTTPresponse,khác mấtreachability publicIP.'],cause:['Tắt guestfirewall chắc chắn khôi phục.','Chưa biết lớp chặn trước khiđọc mitigation.']}),check:question('Muốn biết mitigation bắt đầu lúc nào,đọc mục nào?', 'Mitigationrecord khác route state vàsocket trongguest.',{direct:['PANEL: mitigation','Ghi trigger time vàtargetIP.'],wrong1:['PANEL: upstream','Ghi route chặn,không thay mốc trigger mitigation.'],wrong2:['ss -ltnp','Guestlistener không đọc trạng thái providerprotection.']}),output:question('Mitigation14:05,null-route14:06 trùnglỗi. Nhậnđịnh nào đúng?', 'Routeupstreamđangchặn;trigger vàđiềukiện gỡ cần đúngđội/policy.',{supported:['Protectionupstream liênquan, cầnnetworkreview.','Chưa tựquy trafficmalicious hoặc triggerđúng.'],over:['Tắt guestfirewall sẽgỡnull-route.','Rule trongguest khôngđổi routeprovider.'],ignore:['Incidentđãcóowner nghĩa làIPđãhoạtđộng.','Assigned khácmitigationcleared hoặc dịchvụverified.']}),evidence:question('Chọnhai trạngthái providerđãghi.', 'Mốcprotection vàroutestatekhôngđocontenttraffic hoặcguestsystem.',{p1:['Mitigationtrigger14:05 choIP.20.','Đây làmốccontrolplaneđãghi.'],p2:['Null-routeupstreamactive14:06.','Routechặnđượcbáoởlớpprovider.'],over:['Guestfirewall cóthểtựgỡrouteđó.','Khôngthuộcquyền/cấuhìnhguest.']}),decision:question('Phốihợpkhôiphụcdịchvụtrongmitigation thế nào?', 'Thuincident/traffic/time vàđểđộicóquyềnđánhgiátínhhợplệ/điềukiệngỡ.',{safe:['Gửigraph/incidentchonetwork/securityreview.','Đúngđộiquyếtđịnhprotectiontheopolicyprovider.'],unsafe:['Tựgỡnull-routehoặcmởtoànfirewall.','Vượtscopevàcóthểlàmảnhhưởngtrafficattack.'],close:['Đóngvìincidentđãđượctạora.','Kháchvẫn mấtkếtnối,cầnfollow-up vàverification.']}),order:question('Sắpxếp xửlý IPbịnull-route trongmitigation.', 'Bằngchứngvàpolicytrước,gỡcóquyềnsau,rồitestdịchvụ.',{evidence:['So trigger,time,trafficgraph vàroute.','Đánhgiáphạmvivàđiềukiệnmitigation.'],act:['Network/securityduyệtvàápphươngánprotection.','Gỡroutechỉtheoquyềnvàpolicy.'],verify:['Đan clientnguồnkiểmtraIP/serviceổnđịnh.','Routeđãcókhôngthayend-to-endtest.']})},
    answerOverrides:answer('Mitigationvànull-routeupstreamđangactivecùngcửa sổlỗikếtnối. Trafficspikelớn nhưngchưaphânloạihayxácnhậnfalsepositive.', 'Thugraph/pps,source/time,policyIDvàNET-612;so unaffectedpaths vàcửa sổảnhhưởng.', 'Network/securityreviewtrigger vàđiềukiệnprotection/gỡtheopolicy;khôngbypassởguest.', 'Routekhôiphụcđượcduyệt,multi-sourceclienttớidịchvụvàmonitoringổnđịnh.', 'Chuyểnnetwork/securitycóquyềnprovider,follow-upincidentđế nkhicóverification.', 'Khôngtắtfirewallguesthoặctựgỡnull-routeđểthử;khônghứaresolvedtừincidentassigned.'),
    review:{technical:'Guestvsupstreamscope,triggerkhôngtựchứngminhattack.',editorial:'Escalationvàphục hồi cóđiềukiện.',references:[refs.libvirt],fixtureChanges:[]},
  },
  'VPS-09-008': {
    customerExplanation:'Process quay lại sau khi terminate. Cần tìm cơ chế tái chạy và so artifact với automation được duyệt, chưa xóa để thử.',
    hints:['Process tái xuất hiện có thể do scheduler hoặc supervisor.','So rootcron,process vàhash với inventory tin cậy.','Hashkhác chưa tựchứngminhmalware;giữbinary/timeline rồichuyểnsecurity.'],
    verificationPrompt:'Ghi scheduler,path,hash vàbaseline. Nêuchange/owner cònthiếu,quyềncontainment vàcáchtheo dõitái xuất hiện sauIR.',
    probes:{P1:probe('Đọc crontab của root.','Tìm lịch cóthể gọi lại binary saukhi process bị dừng.','*/5 chạy mỗi5phút; chưa xácnhận jobđượcduyệt hoặc mọi lần process tới từcron.'),P2:probe('Tính hash của binary hiện tại.','So artifact với baseline được owner xác nhận.','Hash chỉđịnh danh nội dung tại thờiđiểmđọc,chưa tựnói malicious.'),G1:probe('Đọc hashagent được duyệt tronginventory.','Cần mộtnguồnbaseline tin cậy thayvìsođoán.','Approvedhashkhác hashhiện tại;cầnchange/versionreview,khôngtự quycompromise.'),G2:probe('Đọc process đangchạy binary.','So user/path/PID với lịchvàartifact.','Process4412 chạyroot,pathagent-update; cầntimeline/ancestry đểxácđịnh cơ chếspawn.')},
    questions:{triage:question('Kháchquan sátgì khiếncầnkiểmtrascheduler?', 'Tái chạy làtriệu chứng,khôngtựđịnhbinary độc hại.',{symptom:['Process xuất hiện lại sau terminate.','Cầnxemcron/supervisor vàowner.'],other:['Nginx chỉtrả404 sau deploy.','Khôngmôtảhànhvitái xuất hiệnprocess.'],cause:['Tái chạyđãchứngminhmalware.','Automation hợp lệ cũngcóthểkhởi độnglại process.']}),check:question('Phép nào đọc lịchrootcron cóthểgọi lạiagent?', 'Lịch chạy khácvới hashbinary hoặc snapshotprocess.',{direct:['crontab -l -u root','Liệt kê lịch chạy dướiroot.'],wrong1:['sha256sum /usr/local/bin/agent-update','Địnhdanhbinary,khôngđọclịch táichạy.'],wrong2:['ps -eo pid,ppid,user,comm,args | grep agent-update','Snapshotprocess không liệt kêschedulerconfig.']}),output:question('Cron5phút,processroot vàhashkhácbaseline:đãbiếtgì?', 'Có cơchếchạyđịnhkỳ vàartifactkhác;quyềnhợplệ/nguồnupdate cầnreview.',{supported:['Nghi persistence chưađượcduyệt,cầnreview.','Soowner/change,timeline vàbảotoànartifacttrướccontainment.'],over:['Hashkhácchứngminhmalware,xóalàđủ.','Updatehợplệcũngđổihash;chưađánhgiáphạmvi.'],ignore:['Rootcronluônlàjobđãđượcownerduyệt.','Crontabkhônglưuapproval/ngườitài khoảnthựchiện.']}),evidence:question('Chọnhaiquansáttừcronvàhashhiệntại.', 'Lịchvànội dungbinarychưađủquyácýhoặcquyềnhợplệ.',{p1:['Rootcronchạyagentmỗi5phút.','*/5 ởcộtphútbiểu thịlịchnày.'],p2:['BinarycóhashSHA256đãđọc.','Cầnsohashvớibaseline/path/versiontin cậy.'],over:['Hashkhácđãchứngminhchỉcầnxóafile.','ChưađịnhnguồnhoặcphạmviIR.']}),decision:question('Làm gì trước khi xóajob hoặcbinarylạ?', 'Giữ scheduler,artifact vàtimeline,đểsecurity xácđịnhcontainment đúngquyền.',{safe:['Bảotoàncron/binary/timeline,chuyểnsecurity.','Giữdữliệu phục vụphạmvi vànguồnthayđổi.'],unsafe:['Xóabinary/cron hoặcreboottrướckhigiữevidence.','Cóthểmấtdữliệuđiềutra nhưngpersistencekháccònlại.'],close:['Đóngticketkhiprocessvừabiếnmất.','Job/supervisorcóthểgọi lại vàphạmvi chưađượckiểmtra.']}),order:question('Sắpxếpxửlýprocesslạtáixuấthiện.', 'Evidence,IRcóquyền,monitoringlàba giaiđoạnkhácnhau.',{evidence:['Giữjob,binary/hash vàprocess/timeline.','Tránhxóachứngcứtrướckhiđịnhnguồn.'],act:['Securityduyệtcontainment vàrecovery.','Đúngscopevàbảotoànbằngchứng.'],verify:['Theo dõitáixuất hiệnvàkiểmtraintegrity.','Mộtlầnkillkhôngloạicơchếtáichạy.']})},
    answerOverrides:answer('Rootcronchạyagentmỗi5phút,processroothiện diện vàhashkhácinventory. Nghiautomation/persistencekhôngđượcduyệt,compromisechưađượckhẳngđịnh.', 'Giữcron,binary/hash,versionmetadata,processancestry vàtimeline;soowner/change/approvedinventory.', 'Securityxácđịnhnguồnvàcontainment/recoverytheoIRrunbook,khôngxóaartifact trướcgiữevidence.', 'Scheduler/artifactđượcgiảithíchhoặcxửlýtheoplan,monitoringkhôngtáixuất hiện vàintegrityđượcđánhgiá.', 'ChuyểnsecurityIRvớiartifact/time/hashvàquyềnrootliênquan.', 'Khôngxóa/rebootđểthử;hashkháchoặctáichạykhôngtựđịnhácý.'),
    review:{technical:'Hash≠malice,cronpossibletriggernotfullattribution.',editorial:'Scheduler/artifact/authorization táchbiệt.',references:['https://man7.org/linux/man-pages/man5/crontab.5.html'],fixtureChanges:[]},
  },
  'VPS-09-001': {
    customerExplanation:'Khách thấy nhiều lần thử mật khẩu SSH thất bại. Cần tìm dấu hiệu đăng nhập thành công, không đánh đồng fail với bị xâm nhập.',
    hints:['Failed khácAccepted trong authlog.','Đối chiếu thời gian/IP và các phiên đăng nhập.','Mẫu ngắn không chứng minh an toàn tuyệt đối; rà Accepted/key/account changes theo policy.'],
    verificationPrompt:'Ghi failed event và các phiên đã thấy, nêu giới hạn cửa sổ log. Đề xuất rà truy cập hợp lệ/không hợp lệ và escalation khi có dấu hiệu thành công.',
    probes:{P1:probe('Đọc các sự kiện SSH gần đây.','Xác nhận log đang nói failed hay accepted.','Failed password cho invaliduseradmin từ.55 là lần xác thực thất bại, không chứng minh login thành công.'),P2:probe('Đọc phiên login được wtmp ghi nhận.','So nguồn/user trong phiên với sự kiện authlog.','Mẫu chỉ liệt kêops từ.12; last không bao phủ mọi hành vi forensic.'),G1:probe('Đọc logSSH trong cửa sổ thời gian cố định.','Kiểm tra quanh failed event thay vì chỉ20dòng cuối.','Có Failed và Connectionclosedpreauth choadmin; không chứng minh không cóaccepted ở nơi/thời điểm khác.')},
    questions:{triage:question('Lời khách về Failed password xác nhận vấn đề gì?', 'Lần thử thất bại là tín hiệu cần theo dõi, khác đăng nhập thành công.', {symptom:['Có nhiều lần thử SSH thất bại.','Cần đối chiếu authlog và phạm vi thời gian.'],other:['Đã có root Accepted từIP lạ.','Khách không nêu sự kiện thành công này.'],cause:['Failed tự chứng minh đã vào server.','Failed nghĩa là lần xác thực đó không được chấp nhận.']}),check:question('Muốn đọc cách xác thựcSSH vừa thất bại, chọn gì?', 'Authlog nêu Failed/Accepted và nguồn; sessionlist hoặc modeconfig không thay thế.', {direct:['journalctl -u sshd -n 20','Đọc sự kiện unitsshd ở CentOS.'],wrong1:['last -n 5','last liệt kê phiên, không mô tả mọi failedattempt.'],wrong2:['sshd -T','Effectiveconfig không phải lịch sử xác thực.']}),output:question('Log Failed invaliduser, last chỉcóops đãbiết. Kết luận nào đủ?', 'Chưa thấy thành công trái phép trong mẫu, nhưng mẫu ngắn không loại mọi compromise.', {supported:['Có failedattempt, chưa xác nhận compromise.','Tiếp tục rà Accepted và thay đổi account/key theo cửa sổ phù hợp.'],over:['Số lầnfail chứng minh đãxâm nhập.','Failcount không thay cho accepted/sessionevidence.'],ignore:['last bình thường chứng minh tuyệt đối sạch.','last và cửa sổ log không phải forensic đầy đủ.']}),evidence:question('Chọn hai quan sát về authlog và sessionlist.', 'Nêu sự kiện hiện có, không mở rộng thành chứng nhận an toàn.', {p1:['admin khôngtồn tại bịfailedpassword.','Log cho user vàIP của lần thất bại.'],p2:['Các phiên liệt kê làops từ.12.','Đây là dữ liệu phiên trong mẫu được cho.'],over:['Mọi failedattempt đều đãvào server.','Trái với ý nghĩaFailed password.']}),decision:question('Nên làm gì với repeatedfailedSSH mà chưathấy accepted lạ?', 'Rà truy cập thành công và thay đổi quyền theo policy; hạn chế thay đổi có tác động rộng.', {safe:['Rà Accepted/key/account vàpolicy monitoring.','Chuyểnsecurity nếu có dấu hiệu thành công hoặc dữ liệu mâu thuẫn.'],unsafe:['Block dảiIPrộng hoặc tắtSSH ngay.','Có thể chặn khách hợp lệ và mất đường quản trị.'],close:['Đóng vì chưathấy phiên lạ trong5dòng.','Cần cửa sổ/phạm vi phù hợp trước kết luận.']})},
    answerOverrides:answer('Có failedpassword cho invaliduseradmin; mẫu last hiện các phiênops đãbiết. Chưa xác nhận đăng nhập trái phép, cũng chưa chứng minh sạch tuyệt đối.', 'Thu nguồn/time, ràAccepted events, key/account/sudo changes và đường truy cập automation trong cửa sổ phù hợp.', 'Theo policy hardening/monitoring được duyệt; không tự chặn rộng hay tắt đường quản trị.', 'Xác minh các phiên/key được giải thích và controls hoạt động; báo rõ phạm vi log đã kiểm tra.', 'Chuyểnsecurity nếu có accepted lạ, thay đổi đặc quyền hoặc thiếu dữ liệu quan trọng.', 'Không dùng failcount để quy compromise hoặc vài dònglast để chứng nhận hệ thống sạch.'),
    review:{technical:'Failed≠accepted,last không forensic đầy đủ.',editorial:'Giữ uncertainty hai chiều vàphạm vi log.',references:[refs.ssh,refs.systemd,'https://man7.org/linux/man-pages/man1/last.1.html'],fixtureChanges:[]},
  },
  'VPS-09-002': {
    customerExplanation:'SSH từoffice lỗi nhưngmobile dùngđược. Cần soIPoffice với jailban và lýdo xác thực trước khi đềxuất unban.',
    hints:['Lỗi phụ thuộcnguồn gợi filtering nhưngchưa đủ quyFail2ban.','So officeegressIP với bannedIPlist vàban timestamp.','Xác minh credential/policy trước unban; không whitelist cảsubnet đểthử.'],
    verificationPrompt:'GhiIPoffice, trạng thái jail vàthời gianban. Nêu authfailures còn cần đọc, quyềnunban và cách kiểmtra login hợp lệ.',
    probes:{P1:probe('Đọc IP đang bịjailsshd ban.','Chỉoffice lỗi nên cần biết nguồn đó cóbịchặn không.','Danh sáchcó.60; cầnxácnhận đúngegressIP củaoffice.'),P2:probe('Đọc sự kiệnFail2ban gầnđây.','Nối trạng thái ban với timestamp trong cửa sổkhách lỗi.','CóBan.60 lúc09:12; chưa cho biết nguyênnhânfailedlogin hoặc thời hạnban.'),G1:probe('Xácnhận officeegressIP qua nguồnđãkiểmtra.','Office cóthểđổiNATIP, khôngđược đoán từIPlưu cũ.','Verified officeIP là.60,khớp bannedentry; quyềnunban vẫn theo policy.')},
    questions:{triage:question('Sooffice vàmobile,phạmvilỗi làgì?', 'Khácnguồn giúpchọnphépsoban/ACL,trướcquylỗitoànservice.',{symptom:['Office SSH lỗi,mobile dùngđược.','Cầnso đườngđi vàsourceIP.'],other:['Mọinguồn đều bịrefused.','Khôngkhớp việcmobile vẫnhoạtđộng.'],cause:['OfficeIPtin cậy nênkhôngcầnđọclog.','Máy trongoffice cũngcóthểgửi credential sai hoặcbịabuse.']}),check:question('Lệnhnào đọcIPhiệnnằmtrongjailsshd?', 'Jailstatuscho trạngtháiban hiện tại;log vàinventory bổsungthời gian/danh tính.',{direct:['fail2ban-client status sshd','Đọc bannedIPlist củađúngjail.'],wrong1:['journalctl -u fail2ban -n 10','Log cósựkiệnnhưngkhôngthaycurrentjailstate.'],wrong2:['PANEL: office egress IP','Xácnhậnnguồn,khôngđọcjailban.']}),output:question('IPoffice.60khớpbanlist vàeventBan. Nhậnđịnh nào đúng?', 'Đãkhớpnguồn bịchặn;authfailure/policyvàthờihạn cầnkiểmtrariêng.',{supported:['OfficeIPkhớpFail2banban.','Phùhợplỗi nguồn,cầnđọcauthlog trướcunban.'],over:['IPtrustednênđượcunbanvĩnhviễn.','Trusted khôngbỏquapolicyhoặclýdoban.'],ignore:['CóBan chứngminh mật khẩuđúng.','Baneventkhôngxácminh credential hợplệ.']}),evidence:question('Chọnhaiđiềujailvàlogghinhận.', 'Banlistvàtimestampkhôngtựcấpquyềnwhitelist.',{p1:['Jail liệt kê198.51.100.60.','Đây làIPđangbịjailhỏiđếnbáoban.'],p2:['LogghiBan.60lúc09:12.','Sựkiệnbanphùhợpthờigianđiềutra.'],over:['Policyđãcho phép whitelistofficevĩnhviễn.','Khôngcóapprovalhoặcpolicyđótrongdữliệu.']}),decision:question('XửlýIPofficebịbanmàvẫngiữpolicythếnào?', 'Sửa nguyênnhânfailedattemptvàunban đúngquyền,nếukhôngIPcóthểbịbanlại.',{safe:['Xácnhậnauthfailures/policy rồiđềxuấtunban códuyệt.','Kiểmtraclientcredentialvàloginhợplệsauđó.'],unsafe:['TắtFail2banhoặcwhitelistcảsubnet.','Giảmbảovệrộngvàcóthểbỏquamáyofficeđangabuse.'],close:['Đóngvìmobileđăngnhậpđược.','Officevẫnlỗivàbanreasonchưađượcxửlý.']})},
    answerOverrides:answer('Officeegress.60đãxácminhkhớpjailban vàeventBan. Chưađọcauthfailurehoặcthờihạnban,khôngtựgọilàban tạm.', 'RàIPnguồn,timestamp,authfailures,clientcredentialvàpolicyunban.', 'Admin/securityduyệtunbanđúngIPnếuphùhợp;sửanguyênnhâncredentialclient,giữFail2banpolicy.', 'Loginhợplệ từoffice thànhcông,khônglặpfail/banaftertestvàcontrols cònhiệulực.', 'Chuyểnsecurity nếuIPchia sẻabuse,banlặplạikhôngrõhoặcngoàiquyền.', 'KhôngtắtFail2banhoặcwhitelistrộngchỉvìnguồnlàoffice.'),
    review:{technical:'Source tạmthời/failedreason chưađượcproven; đãnarrow.',editorial:'SourceIP/jail/policy vàretrylogin cụ thể.',references:[refs.ssh,'https://github.com/fail2ban/fail2ban/wiki'],fixtureChanges:[]},
  },
  'VPS-09-003': {
    customerExplanation:'App hoạt động khiSELinux permissive nhưnglỗiởEnforcing. Cần đọc AVCđúngrequest thay vìtắtpolicy lâu dài.',
    hints:['Enforcing riênglẻkhôngchứngminhpolicychặnrequest.','SoAVC action/process/port vớibackendlistener.','httpd name_connect tới9000cầnpolicyđúngphạmvi;khôngdùngpermissivelàmgiảipháp.'],
    verificationPrompt:'GhiSELinuxmode,AVCprocess/action/port vàbackend. Nêuquyềnsecurityreview,policyhẹp vàcáchtesttrongEnforcing.',
    probes:{P1:probe('ĐọcSELinuxmode.','Kháchbáoappđổihànhvitheomodecầnxácnhận.','Enforcingnghĩalàpolicyđangápdụng,chưađịnhrule bịchặn.'),P2:probe('ĐọcAVCdenial gầnđây.','Cầnchứngcứrequest/process cụthể thayphỏngđoán.','httpd bịdenyname_connect tới9000 khi permissive0;cầnđốichiếutimestamp vàintendedbackend.'),G1:probe('ĐọclistenerTCP9000.','Phânbiệtbackendkhônglisten vớipolicy chặnconnect.','Backendmyapplisten127.0.0.1:9000,nhưngchưađoapphealth/thờigianAVC.')},
    questions:{triage:question('Khách thấy điều gì khi thaymodeSELinux?', 'Mode-dependent behaviorhướngđọcAVC,khôngtựcho phép bỏpolicy.',{symptom:['AppchỉchạykhiSELinuxkhôngEnforcing.','Cầnđọcdenialđúngrequest đểkiểmtra.'],other:['AuthoritativeDNStrảNXDOMAIN.','Khôngkhớpsựthayđổihànhvitheomode.'],cause:['SELinuxphảibịtắtvĩnhviễn.','Cầnsửapolicy/kiếntrúcđúngscope,khôngbỏbảovệ.']}),check:question('LệnhnàođọcmodeSELinuxhiện tại?', 'Modekhácvớilogdenialvàlistenerbackend.',{direct:['getenforce','InEnforcing/Permissive/Disabled.'],wrong1:['ausearch -m AVC -ts recent','Đọclogdenial,khôngthaymodequeryhiệntại.'],wrong2:['ss -ltnp | grep :9000','Đọcsocket,khôngđọcSELinuxmode.']}),output:question('AVCdenyhttpd name_connect9000 vàbackendlisten. Cầnsửalớpnào?', 'AVCphùhợppolicyconnect,cầnreviewtarget/boolean/ruleđúngquyềntrướcmở.',{supported:['ReviewSELinuxpolicy chođúngbackend.','Xácnhậntimestamp/intendedaccess,khôngtắtEnforcing.'],over:['Giữpermissivevĩnhviễnlàan toàn.','Bỏenforcementlàgiảmkiểmsoáttoànrộng.'],ignore:['Backendlistenđãchứngminhpolicykhôngchặn.','Socketcóthểlisten nhưnghttpd vẫn bịdenykết nối.']}),evidence:question('ChọnhaiđiềumodevàAVCthựcsựghinhận.', 'Modevàdenialcầnđọccùngnhau,theoprocess/portthờigian.',{p1:['SELinuxđangEnforcing.','Đây làmodehiệntại.'],p2:['httpd bịdenyname_connecttới9000.','AVCchỉaction/process/target cụthể.'],over:['Permissiveđãđượcduyệtlàmproductionfix.','Khôngcóapprovalhayreview nhưvậy.']}),decision:question('Nên khôiphụckếtnốibackend thế nào?', 'Admin/security chọnpolicyhẹp đúngintendedaccessvàtestlạitrongEnforcing.',{safe:['SoAVC/backend rồireviewpolicyhẹp cóphép.','Boolean/rule chỉđổi khiđúngkiếntrúc vàscope.'],unsafe:['setenforce0hoặcdisableSELinuxchokhách.','Cóthểchewrongtarget vàbỏbảovệrộng.'],close:['Đóngvìappchạyởpermissive.','Yêucầu làchạyan toàn trongEnforcing.']})},
    answerOverrides:answer('SELinuxEnforcingvàAVCdenyhttpd name_connecttới9000,cóbackendlistener. Policyconnectlànghi vấnđượchỗtrợ,cầnđúngtimestamp/intendedaccess.', 'SoAVC,timestamp,backendtarget vàpolicy/booleanđangđặt;kiểmtrahealthbackendriêng.', 'Admin/securityduyệtboolean/rulehẹp đúngkiếntrúc,giữEnforcingvàrollback.', 'Requestapp/backend thànhcông trongEnforcingvàkhôngcóAVCliênquan mớitrongcửa sổtest.', 'Chuyểnsecuritypolicyreview nếu cầncustomrulehoặcquyềnngoàiscope.', 'Khôngdùngsetenforce0làmproductionfixhoặctựmởpolicy rộngkhi chưađịnhaccessmongmuốn.'),
    review:{technical:'Mode≠denial;AVCconnectvàlistener cầncorrelation.',editorial:'Policyhẹp,giữEnforcing,testrequestthực.',references:['https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/using_selinux/'],fixtureChanges:[]},
  },
  'VPS-08-005': {
    customerExplanation:'Sau đổiDNS, một số người dùng vẫn tới server cũ. Cần so authoritative answer với recursive cache và TTL.',
    hints:['Một authoritative trảIP mới chưa đại diện mọi nameserver.','So IP/TTL từ resolver khách và hỏi các authoritative NS.','Giữ server cũ khi còn client dùngIP cũ; chỉ chờTTL sau khi xác nhận zone thống nhất.'],
    verificationPrompt:'Ghi IP/TTL theo từng server được hỏi. Nêu phần authority/cache còn thiếu và cách xác minh hội tụ ở resolver khách.',
    probes:{P1:probe('Hỏi A record trực tiếp authoritative được chọn.','Cần tách dữ liệu zone khỏi cache recursive.','Server được hỏi trả198.51.100.20; chưa kiểm tra mọi authoritative.', 'shop.example.com. 300 IN A 198.51.100.20'),P2:probe('Hỏi A record tại resolver1.1.1.1.','So một cache recursive với authoritative mới.', 'Resolver còn203.0.113.10 vớiTTL120; có thể là cache hợp lệ, cần mốc thay đổi/NS khác.', 'shop.example.com. 120 IN A 203.0.113.10'),G1:probe('Hỏi thêm resolver9.9.9.9.','Xem sự khác biệt có phụ thuộc resolver không.','Resolver này trảIP mới, khác1.1.1.1; chưa chứng minh mọicache đã hội tụ.')},
    questions:{triage:question('Sau đổiDNS, vì sao cần hỏi từ nhiều nguồn?', 'Người dùng khác nhau có thể dùng cache khác nhau; chưa tự xác định mọiauthority khỏe.', {symptom:['Một số client vẫn tớiIP cũ.','Cần so resolver/TTL theo nguồn khách.'],other:['VPS mới chắc chắn đã tắtNginx.','Lời khách chưa cung cấp service state.'],cause:['Tất cả authoritative đều đã đồng nhất.','Chưa hỏi mọiNS để xác minh.']}),check:question('Phép nào bỏ qua recursive cache để hỏi một authoritative?', 'Dùng@server chọn đúng nguồn; vẫn phải kiểm tra nó làauthority của zone.', {direct:['dig @authoritative.example shop.example.com A','Hỏi trực tiếp server được chỉ định.'],wrong1:['dig @1.1.1.1 shop.example.com A','Đây là recursive resolver có thể còn cache.'],wrong2:['free -h','RAM không so authoritative DNS.']}),output:question('Authoritative mới,1.1.1.1 cũTTL120,9.9.9.9 mới: kết luận nào đủ?', 'Có khác biệt theoresolver; cache là giả thuyết hợp lý nhưng authority đồng nhất cần kiểm tra riêng.', {supported:['Resolver trả khác nhau; kiểm traTTL vàcácNS.','Không đánh đồng mộtauthority với toàn bộNS.'],over:['Mọi authoritative chắc chắn trảIP mới.','Chỉ có mộtauthoritative được hỏi.'],ignore:['TTL120 chứng minh phải sửa guestDNS ngay.','Cache chưa hết có thể hợp lệ; đổiguestDNS không sửa sourcezone.']}),evidence:question('Chọn hai kết quả từauthoritative và1.1.1.1.', 'Đọc đúngIP/TTL theo nguồn,không suy mọiNS.', {p1:['Authoritative được hỏi trả198.51.100.20.','Chỉ xác nhận server đó trong lần hỏi.'],p2:['1.1.1.1 còn203.0.113.10,TTL120.','Cache này còn câu trảlời cũ tại thời điểm đo.'],over:['Tất cảNS đều thống nhấtIP mới.','Chưa cótruy vấn tới toàn bộauthoritative.']}),decision:question('Làm gì trước khi tắtserver cũ?', 'Xác nhận authoritative thống nhất vàcache hội tụ; client còn dùngIP cũ cần được bảo vệ.', {safe:['Kiểm tra cácNS vàTTL rồi theo dõiresolver khách.','Chờcache hợp lệ hoặc xửlýauthority bất nhất theo bằng chứng.'],unsafe:['Xóaserver cũ khiresolver cònIP cũ.','Client đó có thểmất dịchvụ trongcửasổcache.'],close:['Đóng vìmộtresolver đãthấyIP mới.','Nhữngclient còn lỗi chưa được xác minh.']}),order:question('Sắp xếp kiểmtraDNS chưa hội tụ saucutover.', 'Sourcezone trước,cache sau,rồixácminh từnguồn từnglỗi.', {evidence:['So authoritativeNS vàresolver/TTL.','Tách zonebất nhất với cachechưa hết.'],act:['SửaNS bất nhất hoặc chờcache hợp lệ.','Chỉchờ khiđã xác nhậnsourceđúng; change theoowner.'],verify:['Resolver khách hội tụ vàsite đúng.','MộtNS hoặc mộtresolver khôngđại diệnmọiclient.']})},
    answerOverrides:answer('Mộtauthoritative và9.9.9.9 trảIP mới,1.1.1.1 cònIP cũTTL120. Cachechưa hết làgiảthuyết,nhưng chưa kiểmtra mọiauthoritative.', 'Hỏi từngauthoritative,so serial/record/TTL vàmốc change;đo resolver từng bịảnh hưởng.', 'Nếuauthority thống nhất,giữdịchvụcũ vàtheodõi cachetheoTTL;nếuNSbất nhất,chuyểnowner sửađúngzone.', 'CácNS thống nhất vàresolver khách hội tụ,domainphục vụsite mới đúng.', 'ChuyểnDNSprovider/owner nếuNS bất nhất hoặc cache vẫn khácquámốc phùhợp.', 'Khôngxóaendpoint cũ khiclient còn dùngcache,khônghứa mọingười cậpnhật đồngthời.'),
    review:{technical:'Không overclaim allauthoritative từsingleNS;TTL/recursive khácnhau.',editorial:'Nguồnquery vàmốc cache cụthể.',references:[refs.dig],fixtureChanges:[{probeId:'P1',reason:'dig không+short: dùng A record thaybareIP.'},{probeId:'P2',reason:'Thay IP TTL120 dạngmô tả bằng A record cóTTL đúngcột.'}]},
  },
  'VPS-08-006': {
    customerExplanation:'Site dùng được quaIPv4 nhưng clientIPv6 thất bại. Cần soA/AAAA với địa chỉ thực được cấp cho endpoint.',
    hints:['IPv4 thành công không kiểmtraIPv6.','SoA/AAAA với allocation trongpanel vàauthorityDNS.','Khôngđược đoánIPv6 hoặc sửafirewall để chữa mộtAAAA chưađúng đích.'],
    verificationPrompt:'Ghi A,AAAA vàallocation. Nêu quyềndomain/IPv6change,điều chưađo vềreachability vàcáchkiểmtra clientIPv6 sauđó.',
    probes:{P1:probe('Hỏi A record của domain.','Đọc đíchIPv4 đểso vớiIPv6.','A là198.51.100.20;chưa nóiAAAA hoặcIPv6path.'),P2:probe('Hỏi AAAA record của domain.','ClientIPv6 cóthể chọnđịa chỉ này thayIPv4.','AAAA là2001:db8:bad::20; phải soallocation/reachability,khôngsuy từA.'),G1:probe('ĐọcIPv6 được cấp cho VPS.','Cầnbiết AAAA cóđúng endpointkhách được cấp.','Panel khôngcấpIPv6 choVPS này;AAAA khôngkhớp allocation hiệncó.'),G2:probe('Hỏi AAAA từauthoritative được chỉđịnh.','Phân biệt cachecũ vớiAAAA đangcóởsource.','NS được hỏi cũng trả2001:db8:bad::20;chưađo mọiauthoritative.')},
    questions:{triage:question('Khách báo sự khácbiệt nào giữa haiIPfamily?', 'Mỗi family cầnDNS vàreachability riêng.', {symptom:['IPv4 dùng được,IPv6 thất bại.','Cần xemAAAA vàendpointIPv6.'],other:['ChỉSSH báoPermissiondenied.','Lời khách nóiwebsite/IPv6,khôngphải accountSSH.'],cause:['IPv6 lỗi nghĩa là A record sai.','A vàAAAA làhai loại record riêng.']}),check:question('Phép nào đọc đíchIPv4 của domain đểso vớiAAAA?', 'A làrecordIPv4;AAAA được hỏi bằngphép riêng.', {direct:['dig +short example.com A','Đọc đíchIPv4 đượcDNS trả.'],wrong1:['dig +short example.com AAAA','ĐọcIPv6,khôngphảiA đanghỏi.'],wrong2:['systemctl restart nginx','Thayđổi servicekhông đọcDNS vàchưa cóquyền.']}),output:question('AAAA tồn tại nhưngpanel khôngcấpIPv6 choVPS này. Nhậnđịnh nào đúng?', 'Có mismatch giữaDNS vàallocation;cầnowner/authority vàđo đích,tránh đoánđịa chỉ.', {supported:['AAAA khôngkhớp allocation hiệncó.','Phải xácnhận endpoint/owner trước sửa hoặc triểnkhaiIPv6.'],over:['A record sai vìIPv6 thất bại.','IPv4 đãhoạtđộng vàrecordA khôngđược kiểmchứng sai.'],ignore:['AAAA tồn tại chứngminhIPv6 đãsẵn sàng.','RecordDNS khôngtựcấpđịa chỉ hoặc mởđườngmạng.']}),evidence:question('Chọn hai địa chỉ được A/AAAA trả.', 'Record chỉnêuđích;tínhsẵnsàngcầnallocation vànetworktest.', {p1:['A trả198.51.100.20.','Đây làđíchIPv4 quan sát.'],p2:['AAAA trả2001:db8:bad::20.','Đây làđíchIPv6 cầnđối chiếu.'],over:['A sai vìAAAA khôngdùngđược.','HaiIPfamily khôngthaythếbằngchứng chonhau.']}),decision:question('XửlýAAAA khôngkhớp allocation thế nào?', 'Domainowner chọnsửa/xóaAAAA khôngdùng hoặc triểnkhaiIPv6 đúngquyền.', {safe:['Xácnhậnowner/authority rồi sửaIPv6DNS cóphép.','KhôngđoánIP;đổi endpointIPv6 làquytrình riêng.'],unsafe:['TựđổifirewallIPv6 hoặcgánIP đoán.','Cóthể gâygiánđoạn,khôngsửađược allocationmismatch.'],close:['Đóng vìIPv4 vẫnhoạtđộng.','KháchIPv6 cònlỗi vàDNS cóthểdẫn họtớisaiđích.']}),order:question('Sắpxếp xửlýsite chỉlỗiIPv6.', 'SoDNS/allocationtrước,change theoowner,sauđótestclientIPv6.', {evidence:['SoA/AAAA,authority vàallocation.','Biếtđíchđượccấp trướcđụngcấuhìnhmạng.'],act:['Owner sửaAAAA hoặcduyệt triểnkhaiIPv6.','Chỉđổi đúngphạmviDNS/network cóquyền.'],verify:['KiểmtraAAAA vàtruycập từclientIPv6.','DNSđúngchưa tựchứngminhsite hoạtđộng.']})},
    answerOverrides:answer('A trảIPv4 cònAAAA trỏIPv6 khôngcótrong allocationVPS. Mismatch cầnDNSowner xácminh;chưađo toàn bộIPv6reachability.', 'Hỏi authoritativeA/AAAA,so allocation vàý địnhdomain;testIPv4/IPv6 tớiđúnghostname/endpoint.', 'Owner sửa/xóaAAAA khôngdùng hoặcduyệt quytrìnhIPv6;khôngđổi firewall hoặcđoánIP.', 'ClientIPv6 nhậnđích hợp lệ vàtải site;hoặcAAAA lỗiđãđược gỡđúngauthority vàcacheđược theoTTL.', 'ChuyểnDNS/networkowner nếuIPv6rollout,cấp phát hoặcquyềndomain ngoài phạmvi.', 'Khôngcoi A hoạtđộng làIPv6đãđúng;khônggánIPv6 tùyý đểkhớpDNS.'),
    review:{technical:'A/AAAA/allocation khácnhau;khôngsuy guestfirewall.',editorial:'Táchfamily vàquyềndomain.',references:[refs.dig],fixtureChanges:[{probeId:'P2',reason:'Guided base fixture tách AAAA thành stdout dig riêng; trạng thái cấp phát IPv6 ở probe panel riêng.'}]},
  },
  'VPS-08-007': {
    customerExplanation:'Nhà cung cấp mail từchối SMTP vì thiếu reverseDNS. Cầnkiểmtra PTR củađúngIP gửi vàquan hệ với hostnameforward.',
    hints:['A record khôngtựtạo PTR choIP.','XácnhậnIPgửithực rồi hỏi reverse lookup.','PTRthuộcIPowner/provider;khớpforwardDNS vẫnchưa bảođảm mailđượcchấpnhận.'],
    verificationPrompt:'GhiIPSMTP,reverseDNS vàforwardA.NêuquyềnđặtPTR,policyHELO/mailcầnso vàcách thửgửi sauchange.',
    probes:{P1:probe('Hỏi PTR choIP198.51.100.20.','Mailprovider đánhgiá IPgửithực,khôngchỉtêndomain.','ReversequeryNXDOMAIN;chưa đánhgiáSPF/DKIM/HELO hoặcchínhsáchkhác.',';; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 51231'),P2:probe('Xem cấu hìnhreverseDNS tạiprovider.','PTRthườngdoIPownerquảnlý,kháczoneforward khách.','PanelghiNotset;chưacóPTRđượccấuhìnhtạimụcquảnlýnày.'),G1:probe('HỏiA củahostnamemail.','TênPTRdựkiến cầnđốichiếuvớiforwardDNS.','mail.example.comtrỏ198.51.100.20;khôngtựtạoPTR.'),G2:probe('XácnhậnIPnguồnSMTPoutbound.','NếuNAT/relayđổiIPthìhỏiPTRcủaIPkháccóthểnhầmmụctiêu.','IPgửithựclà198.51.100.20,khớpđịa chỉđanghỏiPTR.')},
    questions:{triage:question('Khách đang cầnlàm rõđiều kiệnnào củaSMTP?', 'rDNSđánhgiáIPgửi,khácHTTPhoặcDNSforwardriênglẻ.', {symptom:['SMTP bịtừchối vìthiếureverseDNS.','CầnxácnhậnPTRđúngIPgửi.'],other:['Website chỉtrả403 Forbidden.','Khôngmôtảlỗimailproviderđangbáo.'],cause:['ChỉtạoAđãđủsửaPTR.','A vàPTRnằmởhaiquyềnquảnlýkhácnhau.']}),check:question('Lệnhnào hỏireverseDNS củaIPgửi?', 'dig-xchọnreversequerychoIP,khôngphảiforwardA.', {direct:['dig -x 198.51.100.20','HỏiPTRtheođịa chỉIP.'],wrong1:['dig mail.example.com A','HỏiforwardA,khôngkiểmtraPTR.'],wrong2:['systemctl status nginx','NginxkhôngđọcDNSreversecủaSMTPIP.']}),output:question('PTRNXDOMAIN,panelNotset,IPSMTPkhớp. Điều gì cầnxửlý?', 'ThiếuPTRđượchỗtrợ;cầnhostnameforward/quyềnprovider,khônghứa mọiđiềukiệnmailđạt.', {supported:['Chưa cóPTR chođúngIPSMTP.','ForwardA vàpolicyproviderphảiđốichiếutrướcyêucầuPTR.'],over:['ThêmA sẽtựtạoPTR.','Reversezonekhôngđượctạo tựđộngbởirecordAkhách.'],ignore:['PTRthiếuchứngminhwebsiteDNSforwardhỏng.','KhôngcóPTRkhôngnóirằngArecordsai.']}),evidence:question('ChọnhaikếtquảvềreverseDNSđangcó.', 'Negativeanswer vàpanelstatechưađolạitoànbộchínhsáchmail.', {p1:['ReversequerytrảNXDOMAIN.','ChưacóPTRởđiểmhỏi.'],p2:['PanelreverseDNSghiNotset.','Mụcquảnlýproviderchưađặtgiátrị.'],over:['ThêmAđãtạoPTRchoIP.','KhôngcórecordPTRmớihoặckếtquảsauchange.']}),decision:question('Ai cầnthamgiađểđặtPTRđúngIP?', 'IPowner/providerquảnlýreversezone;domainownerquảnlýforward,phảiphốihợp.', {safe:['SoIPgửi/forwardrồiyêucầuproviderđặtPTR.','ĐúngIPvàhostnameđượcduyệttrướcchange.'],unsafe:['SửaA ngẫunhiênrồibáomailđãhoạtđộng.','CóthểpháforwardvàkhôngtạođượcreverseDNS.'],close:['ĐóngvìforwardAđãđúng.','PTRcònthiếuvàmailproviderchưatestlại.']}),order:question('SắpxếpviệcđápứngyêucầureverseDNSSMTP.', 'ĐúngIP/hostname,changeđúngowner,rồitestDNSvàmail.', {evidence:['XácnhậnIPSMTP,PTRvàforwardhostname.','TránhđặtPTRchosaiIPhoặctênkhôngkhớp.'],act:['Provider/IPownerđặtPTRđượcduyệt.','Reversezonekhôngnằmmặcđịnhtrongquyềndomainkhách.'],verify:['SoPTR/forwardvàthửgửivớimailprovider.','PTRđúngchưabảođảmmọipolicySMTPđạt.']})},
    answerOverrides:answer('PTRcủaIPSMTP198.51.100.20trảNXDOMAINvàpanelchưađặtrDNS.Forwardmail.example.comkhớpIP;chưađánhgiácácmailpolicykhác.', 'XácnhậnIPgửithực,hostname/HELO,forwardDNSvàpolicyprovider.', 'Yêucầuprovider/IPownerđặtPTRđúnghostnameđượcduyệt;phốihợpdomainownerchoforward.', 'PTRvàforwardkhớptheopolicy,m ailproviderthửlạivàchấpnhậnrequestgửihợplệ.', 'ChuyểnIPowner/providerhoặcmailteamnếuthiếuquyềnreversezonehoặcvẫnbịtừchốivìpolicykhác.', 'KhônghứadeliverabilitychỉvìPTRđãcó;khôngsửaA ngẫunhiênđểthửreverseDNS.'),
    review:{technical:'PTRkhácA,đúngegressIPvàreversezoneowner.',editorial:'Policyvàmailverificationkhôngquákếtluận.',references:[refs.dig],fixtureChanges:[{probeId:'P1',reason:'NXDOMAINdạngheaderdigthaymôtảstatus.'}]},
  },
  'VPS-08-008': {
    customerExplanation:'Resolver trảSERVFAIL nhưng query có+cd lạiNOERROR. Cầnđiều traDNSSECvalidation màchưa đoánthành phầnDS hayRRSIGsai.',
    hints:['SERVFAIL khôngđồngnghĩadomainkhôngtồntại.','So querybìnhthườngvới+cd vànhiềuresolver.','CầnDS,DNSKEY,RRSIGvàthờigianđểkiểmtrachain;khôngxóaDSđểthử.'],
    verificationPrompt:'Ghiresolver,statusvớivàkhông+cd.Nêuphầnchaincònthiếu,ownerDNSSECcầnphốihợpvàcáchtestvalidatingresolver sauchange.',
    probes:{P1:probe('HỏiAquaresolvervalidating.','Xácnhậnlỗikháchthấytạimộtresolver.','SERVFAILchỉbáoresolverkhônghoàntất,khôngchỉthànhphầnDNSSECnàosai.',';; ->>HEADER<<- opcode: QUERY, status: SERVFAIL, id: 19819'),P2:probe('HỏicùngtênvớicờCheckingDisabled.','Sođườngvalidationvớikếtquảkhiqueryyêucầubỏkiểmtra.','+cdđổiNOERROR,hỗtrợgiảthuyếtvalidation;chưaphânbiệtDS,DNSKEYhoặcsignature.',';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 19820'),G1:probe('Hỏithêmresolver9.9.9.9vớidữliệuDNSSEC.','Tìmdấuvếtcùngphạmviởvalidatorkhác.','ResolverkháccũngSERVFAIL;vẫnchưachỉgãychuỗinào.'),G2:probe('ĐọcDNSKEYtừauthoritative.','CầndữliệukeyđểđốichiếuchainvớiparentDS.','CóDNSKEYalgorithm13;keytồntạikhôngchứngminhDS/RRSIGvàchainhợplệ.',';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 21044\n;; ANSWER SECTION:\nsigned.example.test. 3600 IN DNSKEY 257 3 13 GojIhhXUN/u4v54ZQqGSnyhWJwaubCvTmeexv7bR6edbkrSqQpF64cYbcB7wNcP+e+MAnLr+Wi9xMWyQLc8NAA==')},
    questions:{triage:question('Phạmvip hảnhồiDNSkháchbáocầnsođiềugì?', 'Khácbiệtresolver/statusgợiphépsovalidation,chưaphảichẩnđoánDS.', {symptom:['Resolverkháctrảkếtquảkhácnhau.','Cầnsocùngtên/cửasổvàvalidator.'],other:['LocalNginxluôntrả502.','KhôngphảilỗiDNSSERVFAILđangđượcbáo.'],cause:['SERVFAILchứngminhDSregistrarsai.','SERVFAILcónhiềunguyênnhân,cầnchainvalidation.']}),check:question('Phépnàotái hiệnqueryA tạiresolverkháchđangdùng?', 'Giữđúngtênvàresolvertrướcsocờ+cd.', {direct:['dig @1.1.1.1 signed.example.test A','Hỏicùngtarget/resolvercầnso.'],wrong1:['dig @1.1.1.1 signed.example.test A +cd','Đây làbiếnthểbỏchecking,cầnphépthườngđốichiếutrước.'],wrong2:['systemctl status sshd','SSHstatekhôngkiểmtraDNSSEC.']}),output:question('SERVFAILthànhNOERRORvới+cd:chỉđếnkếtluậnnào?', 'Khácbiệtnàyphùhợpvalidationfailure,nhưngchưađịnhthànhphầngãychuỗi.', {supported:['NghiDNSSECvalidation,cầnđọcchain.','CầnDS/DNSKEY/RRSIGvàthờigiantrướcchange.'],over:['DSchắcchắnsai,xóangaylàsửađúng.','ChưađọcDS,parenthayRRSIGđểquyDS.'],ignore:['DNSKEYcómặtnghĩalàchainđãhợplệ.','KeytồntạichưaxácminhDSmatchhoặcsignature/time.']}),evidence:question('Chọnhaistatusđãquan sátở1.1.1.1.', 'Querythườngvà+cdsođườngchecking,khôngtựxácđịnhkeyhayDSsai.', {p1:['QuerythườngtrảSERVFAIL.','Resolverkhônghoàntấtxửlýởquerynày.'],p2:['Cùngqueryvới+cdtrảNOERROR.','CókhácbiệtkhiyêucầuCheckingDisabled.'],over:['RegistrarđãđượcchứngminhsaivàcóthểxóaDS.','ChưađủDS/key/signatureevidencehoặcquyền.']}),decision:question('NênchuyểnvấnđềDNSSECvớibằngchứnggì?', 'DNSowner/registrarphảiphốihợpsửachaincórollback,khôngtắtvalidationđểche.', {safe:['ThuDS/key/signaturevàchuyểnDNSowner.','Kèmcửasổ,statusnhiềuresolvervàchangehistory.'],unsafe:['XóaDShotắtDNSSECtrướcđốichiếuchain.','Cóthểgiảmbảovệvàtạogiánđoạnmàchưasửanguyênnhân.'],close:['Đóngvì+cdkhôngSERVFAIL.','Clientvalidatingvẫncầnchainhợplệ.']}),order:question('SắpxếpđiềutravalidationDNSSEC.', 'Thudữliệuchain,sửacóquyền,rồitestđúngvalidator.', {evidence:['SoDS,DNSKEY,RRSIG,timevàresolver.','Địnhđiểmgãychuỗitrướcsửa.'],act:['DNSowner/registrardu yệtchangevàrollback.','Quyềnparentvàzonecóthểthuộchaibên.'],verify:['ValidatingresolvertrảđúngsauTTL.','NOERRORvới+cdkhôngphảixácminhvalidation.']})},
    answerOverrides:answer('QueryvalidatingSERVFAILnhưng+cdNOERROR;validatorkháccũngSERVFAIL.NghiDNSSECvalidation,chưađịnhDS,DNSKEY,RRSIGhoặctime.', 'ThuDSparent,DNSKEY/RRSIGauthoritative,time/keyrollovervàstatusnhiềuvalidator.', 'DNSowner/provider/registrarphốihợpsửachuỗiđượckiểmchứngcóchange/rollback;khôngxóaDSđểthử.', 'ValidatortrảrecordđúngvàchainhợplệsauTTL;clientdùngDNSbìnhthườngtruycậpsite.', 'ChuyểnDNSSECowner/registrarnếuthiếudữliệuchainhoặcquyềnparent/zone.', 'KhôngtắtDNSSECvalidationởclienthoặcxóaDSkhichưaxácđịnhthànhphầnsai.'),
    review:{technical:'Algorithm13keyphảiECDSAP256,noellipsis;DNSKEY≠validchain.',editorial:'GiữuncertainDSvskey/signature.',references:[refs.dig,'https://www.rfc-editor.org/rfc/rfc6605.html'],fixtureChanges:[{probeId:'P1',reason:'SERVFAILdạngheaderdig.'},{probeId:'P2',reason:'NOERRORdạngheaderdig;khôngbịaAanswer.'},{probeId:'G2',reason:'ThayAwEAAa...placeholdervàkeyformatkhôngđúngalgorithm13bằngpublictestkeyRFC6605section6.1.'}]},
  },
  'VPS-08-001': {
    customerExplanation:'Sau migration, domain vẫn mở server cũ. Cần so địa chỉ DNS được trả với IP mới và kế hoạch chuyển dịch vụ.',
    hints:['DNS trả một IP chưa chứng minh mọi resolver đều giống nhau.','So A record với IP được cấp cho VPS mới.','Xác nhận authoritative zone và owner đã sẵn sàng cutover trước đổi record.'],
    verificationPrompt:'Ghi A record quan sát, IP VPS mới và điều chưa biết về authority/cache. Nêu quyền đổi DNS và cách kiểm tra site sau cutover.',
    probes:{P1:probe('Hỏi A record đang được resolver trả.', 'Xem hostname đang dẫn người dùng tới IPv4 nào.', 'Resolver trả203.0.113.10; một điểm hỏi không đại diện mọi resolver.'),P2:probe('Đọc IP VPS mới trong panel.', 'Cần một mục tiêu cutover đã xác nhận để so DNS.', 'Panel ghi198.51.100.20; phải xác nhận đây là IP owner muốn domain dùng.')},
    questions:{triage:question('Sau migration, khách thấy domain dẫn tới đâu?', 'Đích người dùng thấy khác với kế hoạch migration; cần DNS và IP allocation để so.', {symptom:['Domain vẫn mở server cũ.','Đây là triệu chứng sau chuyển dịch vụ.'],other:['VPS mới không có IPv4.','Lời báo chưa xác nhận thiếu IP trên VPS mới.'],cause:['Mọi resolver chắc chắn đều sai.','Một kết quả từ khách chưa mô tả toàn bộ DNS.']}),check:question('Lệnh nào hỏi IPv4 hiện được trả cho shop.example.test?', 'Loại A dùng cho IPv4 của hostname; service guest không đọc record domain.', {direct:['dig +short shop.example.test A','Trả A record theo resolver đang dùng.'],wrong1:['PANEL: current assigned IP','Panel cho IP cấp phát, không cho DNS đang trả.'],wrong2:['systemctl status sshd','StateSSH không đọc A record.']}),output:question('DNS trả203.0.113.10, VPS mới198.51.100.20. Điều gì đã rõ?', 'Hai địa chỉ khác nhau; cần authority và kế hoạch cutover trước kết luận phạm vi cache.', {supported:['A record quan sát khác IP VPS mới.','Kiểm tra authoritative zone và IP mục tiêu được duyệt.'],over:['Mọi resolver đều còn IP cũ.','Chỉ có một điểm truy vấn được cho.'],ignore:['IP trong panel tự cập nhật mọi DNS.','Cấp phát VPS không tự thay zone domain bên ngoài.']}),evidence:question('Chọn hai địa chỉ được hai nguồn trả về.', 'DNS answer và IP allocation là hai nguồn riêng, chưa thay cho approval cutover.', {p1:['DNS trả203.0.113.10.','Đây là A record tại điểm hỏi.'],p2:['Panel ghi198.51.100.20.','Đây là IP mới được cấp cho VPS.'],over:['Tất cả authoritative đều trả IP cũ.','Chưa hỏi từng authoritative NS.']}),decision:question('Làm gì trước khi đổi A record sang VPS mới?', 'Xác nhận owner, authority và readiness/cutover; sửa đúng zone rồi xác minh client.', {safe:['Xác nhận owner/zone/cutover rồi đổi có quyền.','Tránh đưa traffic tới endpoint chưa sẵn sàng hoặc sửa nhầm zone.'],unsafe:['Xóa zone cũ để ép client đổi IP.','Có thể cắt DNS mà không sửa cache/delegation.'],close:['Đóng vì VPS mới đã có IP.','Khách vẫn tới server cũ qua domain.']})},
    answerOverrides:answer('A record quan sát203.0.113.10 khác IP VPS mới198.51.100.20. Chưa biết mọi authoritative/resolver và chưa xác nhận kế hoạch cutover.', 'Xác nhận owner, authoritative NS, record hiện hành, TTL và readiness của VPS mới.', 'Owner duyệt cutover; cập nhật đúng A record trong zone có thẩm quyền, giữ khả năng rollback.', 'Authoritative trả đúng, resolver client hội tụ theo TTL và domain mở đúng site mới.', 'Chuyển DNS/domain owner nếu thiếu quyền hoặc delegation/zone không rõ.', 'Không xóa zone/server cũ trước khi đánh giá resolver còn cache và dữ liệu cần giữ.'),
    review:{technical:'Single resolver không đại diện toàn DNS; allocation không tự cập nhật domain.',editorial:'Hai IP và cutover là trọng tâm riêng.',references:[refs.dig],fixtureChanges:[]},
  },
  'VPS-08-002': {
    customerExplanation:'Khách nhập ww.example.com nhưng tên thường dùng là www.example.com. Hai hostname khác nhau cần được hỏi DNS riêng trước khi sửa zone.',
    hints:['Ghi nguyên hostname khách nhập, kể cả số chữw.','So DNS cho ww vàwww trên cùng điểm truy vấn.','NXDOMAIN của một tên không làm cả zone hỏng; xác nhận tên owner muốn dùng trước thêm alias.'],
    verificationPrompt:'Ghi hai hostname và kết quả DNS khác nhau. Nêu cách xác nhận FQDN mong muốn, quyền thêm alias và kiểm tra DNS/HTTP theo tên đúng.',
    probes:{P1:probe('Hỏi đúng hostname ww khách đã nhập.', 'Tránh sửa một tên khác rồi bỏ qua vấn đề khách thấy.', 'ww.example.com trảNXDOMAIN tại resolver được hỏi; chưa nói web server khỏe hay hỏng.', ';; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 10421'),P2:probe('Hỏi hostname www để đối chiếu.', 'Tên gần giống có thể là tên owner dự định dùng.', 'www.example.com có A198.51.100.20; chưa xác nhận ww là typo hay alias được yêu cầu.', ';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 10422\n;; ANSWER SECTION:\nwww.example.com. 300 IN A 198.51.100.20'),G1:probe('Hỏi A của tên zone gốc.', 'Một tên lỗi không có nghĩa mọi record của zone mất.', 'example.com trả A198.51.100.20; chỉ mô tả tên được hỏi.', ';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 10423\n;; ANSWER SECTION:\nexample.com. 300 IN A 198.51.100.20'),G2:probe('Hỏi thêm loạiNS cho đúng tên ww.', 'Đối chiếu trạng thái không tồn tại của tên khách dùng.', 'ww vẫnNXDOMAIN; không được suy toàn bộ authoritative zone hỏng.', ';; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 10424')},
    questions:{triage:question('Vấn đề nào cần kiểm tra với hostname khách đã nhập?', 'Giữ đúng FQDN trước khi chuyển sang HTTP hoặc cấu hình server.', {dns:['Hostname đã nhập không phân giải được.','Cần hỏi DNS cho đúng tên, không sửa sang tên khác trước.'],http:['Proxy trả502 từ backend.','Chưa có HTTP response hoặc backend evidence.'],ssh:['SSH từ chối mật khẩu.','Ticket nói hostname website, không nói xác thựcSSH.']}),check:question('Muốn kiểm tra đúng tên khách dùng, bắt đầu với lệnh nào?', 'ww vàwww là hai tên riêng trong DNS, dù chỉ khác một ký tự.', {ww:['dig ww.example.com A','Hỏi trực tiếp tên khách đã nhập.'],www:['Chỉ dig www.example.com A','Tên dự kiến hữu ích để so, nhưng chưa kiểm tra đúng tên khách đang lỗi.'],disk:['df -h /','Dung lượng guest không phân giải hostname.']}),output:question('ww NXDOMAIN nhưng www có A record. Kết luận nào vừa đủ?', 'Hai hostname có kết quả khác nhau; phải hỏi owner tên mong muốn trước coi là lỗi zone.', {different:['Hai hostname khác nhau, ww chưa tồn tại tại điểm hỏi.','Không tự quyết định ww là typo hay alias owner muốn dùng.'],zone:['Toàn bộ zone đã hỏng.','www và tên gốc vẫn có câu trả lời.'],http:['Web server chắc chắn đã dừng.','DNS không kiểm tra HTTP service.']}),evidence:question('Chọn hai kết quả DNS đang được quan sát.', 'Kết quả tên cụ thể không chứng minh web health hoặc mọi provider.', {ww:['ww trảNXDOMAIN.','Resolver không tìm thấy tên này trong phép hỏi.'],www:['www trả198.51.100.20.','A record cho tênwww có câu trả lời.'],down:['Web server đã hỏng.','Chưa gửi requestHTTP để kiểm tra.'],provider:['Mọi DNS provider đều lỗi.','Hai truy vấn không đo mọi provider hay resolver.']}),decision:question('Nên xử lý sự khác biệt ww/www với owner thế nào?', 'Xác nhận tên cần dùng; sửa typo hoặc thêm record theo quyền, không xóa zone.', {confirm:['Xác nhận FQDN, sửa typo hoặc tạo alias có quyền.','Giữ ý định domain owner trước thay DNS.'],all:['Xóa toàn bộ record để dựng lại zone.','Phá các tên đang hoạt động và chưa cần thiết.'],reboot:['Reboot VPS để ww phân giải.','Reboot guest không tạo record trong authoritative DNS.']}),sequence:question('Sắp xếp kiểm tra một hostname gần giống tên đang hoạt động.', 'Giữ đúng tên, so dữ liệu, hỏi ý định rồi xác minh sau sửa.', {exact:['Ghi nguyên FQDN khách đã nhập.','Tránh kiểm tra nhầmww thànhwww.'],compare:['Tra tên đó và tên dự kiến.','So kết quả trước khi kết luận typo.'],confirm:['Xác nhận hostname cần dùng với owner.','Owner quyết định typo hay alias cần tạo.'],verify:['Sau sửa có quyền, kiểm tra DNS và HTTP.','DNS đúng chưa bảo đảm website trả đúng nội dung.']})},
    answerOverrides:answer('ww.example.com trảNXDOMAIN, cònwww.example.com và tên gốc có A record. Có khác biệt hostname; chưa được tự khẳng định owner chỉ gõ nhầm.', 'Xác nhận FQDN khách muốn dùng, kiểm tra record và authority cho đúng tên.', 'Nếu là typo, hướng khách dùng tên đúng; nếu cần alias, domain owner duyệt tạo record phù hợp.', 'Tên được thống nhất phân giải đúng và HTTP/TLS theo hostname đó hoạt động.', 'Chuyển DNS owner nếu tên đúng vẫn lỗi, authority bất nhất hoặc không có quyền sửa zone.', 'Không xóa zone hoặc reboot VPS để chữa NXDOMAIN của một hostname.'),
    review:{technical:'NXDOMAIN là tên cụ thể; reviewed manualpilot và exactFQDN.',editorial:'Không dùng fixture; giải thích ww/www và ý địnhowner.',references:[refs.dig],fixtureChanges:[{probeId:'P1',reason:'Định dạng NXDOMAIN như headerdig thật.'},{probeId:'P2',reason:'dig không+short phải có A record, không chỉ bareIP.'},{probeId:'G1',reason:'Thay mô tả status/ANSWER bằng header vàA record.'},{probeId:'G2',reason:'Định dạng NXDOMAIN như headerdig.'}]},
  },
  'VPS-08-004': {
    customerExplanation:'HTTP theoIP hoạt động nhưng tên miền không phân giải. Cần tách kết nối IP khỏi đường tới DNS resolver.',
    hints:['Một HTTP200 theoIP không kiểm tra DNS.','Đọc resolver được cấu hình rồi thử truy vấn tới resolver đó.','Timeout khácNXDOMAIN: chưa có bằng chứng recordA bị thiếu.'],
    verificationPrompt:'Ghi HTTP theoIP và lỗiDNS. Nêu cách tìm resolver/profile, quyền sửa và kiểm tra domain trong ứng dụng sau đó.',
    probes:{P1:probe('Thử HTTP trực tiếp tớiIPv4.','Phân biệt lỗi IP/service với bước phân giải tên.','HTTP200 tạiIP chứng minh request này thành công, không chứng minh mọi path/port.'),P2:probe('Hỏi A record qua resolver mặc định.','Khách lỗi tên miền dù một IP HTTP hoạt động.','Querytimeout, không liên lạc được DNS server; chưa có NXDOMAIN hay xác nhận record sai.', ';; connection timed out; no servers could be reached')},
    questions:{triage:question('So IP vàdomain, khách gặp lỗi ở bước nào cần khoanh?', 'Kết nối theoIP và phân giải tên là hai phép thử khác nhau.', {symptom:['IP dùng được nhưng domain không resolve.','Cần đọc resolver/pathDNS.'],other:['Mọi HTTP tớiIP đều thất bại.','Đã có phép HTTP theoIP thành công.'],cause:['Domain chắc chắn không có A record.','Chưa có câu trả lờiDNS; mới làtimeout.']}),check:question('Phép nào kiểm traHTTP mà không cần phân giải hostname?', 'Dùng IP trực tiếp để đo một HTTPpath; không thay thếDNS.', {direct:['curl -I http://198.51.100.20','Request dùng IP nên tách bướcDNS.'],wrong1:['dig example.com A','dig đoDNS, không kiểm traHTTP theoIP.'],wrong2:['systemctl status nginx','State local không đo HTTP response tớiIP được hỏi.']}),output:question('HTTPIP200 cònDNS timeout: có thể kết luận gì?', 'Một đườngIP/service hoạt động, cònresolver hoặcđườngtới nó cầnkiểmtra; khôngquy lỗi record.', {supported:['Kiểm tra resolver vàđường DNS.','Timeout chưa cho biết domain córecord haykhông.'],over:['Domain chắc chắn không có A record.','Không cóNXDOMAIN/NODATA từresolver.'],ignore:['HTTPIP200 chứng minhDNS khỏe.','RequestIP không cần name resolution.']}),evidence:question('Chọn hai kết quảthực tế trong cặpkiểm tra.', 'StatusHTTP vàDNS transporttimeout cóphạm vi khácnhau.', {p1:['HTTP theoIP trả200.','Phéprequest này nhận phản hồiHTTP.'],p2:['DNS querytimeout.','Không nhận được câu trảlời từDNS server.'],over:['A record authoritative đãxácnhận thiếu.','Chưa cóauthoritativeanswer hoặcNXDOMAIN.']}),decision:question('Sửa đườngDNS guest thế nào trước khi đổiresolver?', 'Đọc config/profile,thử đúngresolver vàsửa theopolicy cóquyền.', {safe:['So resolv.conf/profile vàthửresolver đãcấu hình.','Tìm lỗiDNS/network trước khi ápchange phùhợp.'],unsafe:['Ghi đè resolver bằngIP ngẫu nhiên.','Có thể pháDNS nội bộ/managedprofile vàkhông địnhnguyênnhân.'],close:['Đóng vìHTTPIP200.','Ứngdụng còn cầnphân giải domain.']})},
    answerOverrides:answer('HTTP theoIP trả200, DNS querytimeout. Nghi resolver hoặcđườngtới resolver, chưa xácnhận recorddomain sai.', 'Đọc resolv.conf vàDNS của networkprofile; thửresolver được cấu hình,đốichiếu connectivity/providerstatus.', 'Admin sửaresolver/network trong đúngprofile theo policy vàquyền, giữrollback vàconsole nếu đổi mạng.', 'dig cócâu trảlời hợp lệ vàứngdụng dùngdomain hoạtđộng; thửđúnghostname khách.', 'Chuyển network/resolverprovider nếu đườngtớiDNS hoặc serviceprovider lỗi.', 'Không đổiDNS ngẫu nhiên hoặcghiđè fileđược networkmanager quảnlý khi chưabiếtpolicy.'),
    review:{technical:'Timeout khácnegativeanswer,khôngclaimAabsent.',editorial:'IPtestvsresolverpath riêng.',references:[refs.dig],fixtureChanges:[{probeId:'P2',reason:'Giữ nguyên timeout nhưngthêm prefix;; đúngkiểu dig.'}]},
  },
  'VPS-07-007': {
    "customerExplanation": "Chỉ shop.example.com báo cảnh báo chứng chỉ TLS. Cần đối chiếu DNS, SNI, SAN và virtual host của đúng hostname này.",
    "hints": [
      "Một IP có thể phục vụ nhiều chứng chỉ nhờ SNI.",
      "So chứng chỉ được gửi cho shop.example.com với server_name và danh mục chứng chỉ.",
      "CN api.example.com chưa chứng minh chứng chỉ thiếu SAN cho shop.example.com; cần đọc SAN và cấu hình đang chạy."
    ],
    "verificationPrompt": "Ghi hostname, SNI, CN và virtual host đã quan sát. Nêu phần SAN hoặc chain còn thiếu, quyền sửa cấu hình và cách thử lại đúng domain.",
    "probes": {
      "P1": {
        "purpose": "Lấy chứng chỉ theo SNI shop.example.com tại IP đích.",
        "why": "Cần hỏi đúng hostname bị cảnh báo để tránh chỉ nhận chứng chỉ mặc định.",
        "meaning": "Chứng chỉ có CN api.example.com; chưa đọc SAN nên chưa biết các tên được bao phủ."
      },
      "P2": {
        "purpose": "Đọc cấu hình Nginx trên đĩa.",
        "why": "So server_name và default_server với SNI khách dùng.",
        "meaning": "Bản dump chỉ thấy default_server cho api.example.com; cần xác nhận cấu hình đang chạy và SAN của chứng chỉ."
      },
      "G1": {
        "purpose": "Tra bản ghi A của shop.example.com.",
        "why": "Xác nhận IPv4 có khớp endpoint đang kiểm tra.",
        "meaning": "A trỏ đến 198.51.100.20; chưa kiểm tra AAAA hoặc mọi resolver."
      },
      "G2": {
        "purpose": "Đọc danh mục chứng chỉ đã cài.",
        "why": "So dữ liệu quản lý chứng chỉ với endpoint thực tế.",
        "meaning": "Danh mục chỉ liệt kê api.example.com; vẫn cần kiểm tra SAN và chain từ chứng chỉ được gửi."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách báo cảnh báo chứng chỉ ở phạm vi nào?",
        "explanation": "Cần thử đúng hostname bị lỗi trước khi kết luận về các domain khác.",
        "options": {
          "symptom": [
            "Một domain báo cảnh báo chứng chỉ.",
            "Lời khách xác định một domain; cần thử đúng SNI của nó."
          ],
          "other": [
            "Mọi domain đều không kết nối được cổng 443.",
            "Khách chỉ báo cảnh báo chứng chỉ trên một domain."
          ],
          "cause": [
            "Phải tắt xác thực TLS để truy cập.",
            "Chưa kiểm tra chứng chỉ và ánh xạ virtual host; tắt xác thực không sửa lỗi."
          ]
        }
      },
      "check": {
        "prompt": "Lệnh nào lấy chứng chỉ cho shop.example.com tại IP đang kiểm tra?",
        "explanation": "Tham số -servername gửi đúng SNI; kết nối chỉ theo IP có thể nhận chứng chỉ mặc định.",
        "options": {
          "direct": [
            "openssl s_client -connect 198.51.100.20:443 -servername shop.example.com",
            "Lệnh gửi SNI shop.example.com đến đúng endpoint."
          ],
          "wrong1": [
            "dig +short shop.example.com A",
            "DNS trả IP, không lấy chứng chỉ TLS từ endpoint."
          ],
          "wrong2": [
            "systemctl status nginx",
            "Trạng thái dịch vụ không cho biết chứng chỉ được chọn theo SNI."
          ]
        }
      },
      "output": {
        "prompt": "SNI shop nhận CN api; bản dump chỉ thấy virtual host mặc định cho api. Kết luận nào phù hợp?",
        "explanation": "CN khác tên là dấu hiệu cần điều tra; SAN vẫn có thể bao phủ nhiều hostname.",
        "options": {
          "supported": [
            "Nghi vấn ánh xạ chứng chỉ; cần đọc SAN và virtual host đang chạy.",
            "Chưa đủ SAN, chain và cấu hình runtime để khẳng định hostname mismatch."
          ],
          "over": [
            "Tắt xác thực TLS là cách sửa đúng.",
            "Bỏ xác thực có thể che việc kết nối sai máy chủ."
          ],
          "ignore": [
            "CN api chắc chắn loại trừ SAN cho shop.",
            "SAN có thể chứa nhiều hostname ngoài CN."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai quan sát thực sự có trong chứng chỉ và cấu hình đã đọc.",
        "explanation": "Chỉ ghi CN và virtual host đã thấy; chưa suy ra danh sách SAN.",
        "options": {
          "p1": [
            "Chứng chỉ được gửi có CN api.example.com.",
            "Đây là subject đã quan sát, chưa phải danh sách SAN."
          ],
          "p2": [
            "Bản dump chỉ thấy virtual host mặc định cho api.",
            "Cần đối chiếu virtual host được nạp và nơi triển khai chứng chỉ."
          ],
          "over": [
            "Được phép tắt xác thực TLS.",
            "Không có quyền hạn hay bằng chứng cho việc giảm xác thực."
          ]
        }
      },
      "decision": {
        "prompt": "Nên sửa lỗi ở đúng domain và giữ xác thực TLS thế nào?",
        "explanation": "Đối chiếu hostname, IP, SAN và ánh xạ trước khi triển khai chứng chỉ theo quyền.",
        "options": {
          "safe": [
            "Kiểm tra DNS, SAN, virtual host rồi sửa theo quyền.",
            "So A/AAAA, cấu hình runtime và chứng chỉ đúng hostname; chuẩn bị cách hoàn tác."
          ],
          "unsafe": [
            "Cho mọi client bỏ xác thực TLS.",
            "Client có thể kết nối sai server mà không được cảnh báo."
          ],
          "close": [
            "Đóng ticket vì chứng chỉ hợp lệ cho api.",
            "Khách dùng shop.example.com; phải kiểm tra đúng hostname này."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp các bước kiểm tra cảnh báo chứng chỉ chỉ ở shop.example.com.",
        "explanation": "Xác định đúng hostname và endpoint, thay đổi có duyệt, rồi xác minh TLS và nội dung.",
        "options": {
          "evidence": [
            "So DNS, SNI, SAN, chain và virtual host đang chạy.",
            "CN hoặc virtual host mặc định riêng lẻ chưa đủ."
          ],
          "act": [
            "Triển khai chứng chỉ hoặc ánh xạ đúng theo phê duyệt.",
            "Kiểm tra cấu hình và phương án hoàn tác trước khi nạp lại."
          ],
          "verify": [
            "Thử SNI shop và xác nhận chứng chỉ cùng trang đúng.",
            "Thử từ client, không chỉ đọc danh mục chứng chỉ."
          ]
        }
      }
    },
    "answerOverrides": {
      "expected_diagnosis": "SNI shop nhận chứng chỉ có CN api và bản dump chỉ thấy virtual host mặc định cho api. Nghi vấn ánh xạ chứng chỉ; CN riêng lẻ chưa chứng minh SAN không bao phủ shop.",
      "recommended_next_checks": "Đối chiếu A/AAAA, SNI, SAN, chain và server block đang chạy trên endpoint liên quan.",
      "resolution_guidance": "Người có quyền sửa ánh xạ hoặc triển khai chứng chỉ đúng hostname theo quy trình thay đổi; kiểm tra cấu hình và phương án hoàn tác trước khi nạp lại.",
      "verification": "Client dùng SNI shop xác minh chain, hostname, hạn dùng và nội dung trang; kiểm tra các domain chung IP nếu bị ảnh hưởng.",
      "escalate_when": "Chuyển nhóm TLS hoặc chủ site nếu thiếu quyền với chứng chỉ, hoặc chưa rõ cấu hình đang chạy trên nhiều endpoint.",
      "production_warning": "Không tắt xác thực TLS để che cảnh báo; không kết luận hostname mismatch chỉ từ CN khi chưa đọc SAN."
    },
    "review": {
      "technical": "CN không thay SAN; thu hẹp chẩn đoán mapping nguồn.",
      "editorial": "Viết lại toàn bộ lời dẫn, probe, câu hỏi, phản hồi và đáp án để loại bỏ từ bị dính; giữ bất định về SAN và cấu hình runtime.",
      "references": [
        "https://docs.openssl.org/3.0/man1/openssl-s_client/",
        "https://nginx.org/en/docs/"
      ],
      "fixtureChanges": [{"probeId":"P2","reason":"Guided base fixture thay từ missing trong source bằng trích đoạn nginx -T có cú pháp cấu hình; chưa chứng minh config runtime hoặc SAN."}]
    }
  },
  'VPS-07-008': {
    "customerExplanation": "API thường trả HTTP 504 vào giờ cao điểm. Cần đối chiếu thời điểm proxy hết hạn chờ với độ trễ backend và tải.",
    "hints": [
      "Dịch vụ active vẫn có thể phản hồi quá chậm.",
      "So log lỗi, thời gian phản hồi tại backend và đồ thị tải trong cùng cửa sổ.",
      "Chưa biết CPU, cơ sở dữ liệu hay dependency gây chậm; cần thu trace và metrics trước khi đổi timeout."
    ],
    "verificationPrompt": "Ghi giai đoạn timeout, thời gian phản hồi backend và cửa sổ cao điểm. Nêu dữ liệu ứng dụng cần thu, nhóm nhận việc và tiêu chí về độ trễ, tỷ lệ 504 sau thay đổi.",
    "probes": {
      "P1": {
        "purpose": "Đọc giai đoạn proxy bị timeout.",
        "why": "Xác định proxy đang chờ phần nào của upstream.",
        "meaning": "Proxy hết hạn khi đọc response header; chưa biết nguyên nhân chậm là CPU, cơ sở dữ liệu hay mạng."
      },
      "P2": {
        "purpose": "Đo tổng thời gian một yêu cầu health tới backend.",
        "why": "So độ trễ backend với sự cố proxy cùng thời điểm.",
        "meaning": "Mẫu này mất 31,4 giây; một mẫu chưa đại diện mọi request hoặc xác định nút thắt.",
        "output": "31.400000"
      },
      "G1": {
        "purpose": "Đọc trạng thái dịch vụ API.",
        "why": "Process có thể còn chạy nhưng bị nghẽn hàng đợi dưới tải.",
        "meaning": "Trạng thái active không đo độ trễ, hàng đợi hay dependency."
      },
      "G2": {
        "purpose": "So tải, độ trễ và số lỗi 504 giữa giờ cao điểm và ngoài cao điểm.",
        "why": "Cần tương quan thời gian để chọn phép đo tiếp.",
        "meaning": "Lúc 19:00 có p95 28,1 giây và 214 lỗi 504; lúc 20:00 tải giảm, không có 504. Đây là tương quan, chưa xác định nguyên nhân."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Dấu hiệu nào giúp chọn thời điểm đo lỗi API?",
        "explanation": "Lỗi tập trung vào giờ cao điểm, nên cần dữ liệu ở lúc khách bị ảnh hưởng.",
        "options": {
          "symptom": [
            "API trả 504 vào giờ cao điểm.",
            "Đo trong cửa sổ cao điểm thay vì chỉ lúc vắng tải."
          ],
          "other": [
            "Một tệp tĩnh luôn trả 404.",
            "Đó là lỗi khác với 504 xuất hiện theo thời điểm."
          ],
          "cause": [
            "Giờ cao điểm chứng minh cơ sở dữ liệu hỏng.",
            "Tải cao chưa xác định dependency hoặc tài nguyên nào gây chậm."
          ]
        }
      },
      "check": {
        "prompt": "Muốn biết proxy hết hạn chờ ở bước nào, nên đọc gì?",
        "explanation": "Log lỗi mô tả giai đoạn upstream; cần thêm metrics để tìm nguyên nhân sâu hơn.",
        "options": {
          "direct": [
            "tail /var/log/nginx/error.log",
            "Log cho biết proxy đợi response header quá hạn."
          ],
          "wrong1": [
            "dig example.com A",
            "Bản ghi A không cho biết giai đoạn timeout của upstream."
          ],
          "wrong2": [
            "curl -I http://127.0.0.1/api",
            "Một HTTP status tại local chưa nêu giai đoạn upstream timeout trong log."
          ]
        }
      },
      "output": {
        "prompt": "Health mất 31,4 giây và proxy timeout khi đọc header. Dữ liệu hỗ trợ nhận định nào?",
        "explanation": "Đường xử lý backend chậm; cần đo thêm CPU, cơ sở dữ liệu và dependency.",
        "options": {
          "supported": [
            "Backend chậm; cần đo thêm lúc cao điểm.",
            "Log và yêu cầu local phù hợp, nhưng chưa xác định nút thắt."
          ],
          "over": [
            "Tăng timeout vô hạn sẽ sửa backend.",
            "Chờ lâu hơn không giúp backend nhanh hơn và có thể tăng hàng đợi."
          ],
          "ignore": [
            "Dịch vụ active chứng minh API đạt SLA.",
            "Process chạy không đo độ trễ hoặc tỷ lệ lỗi."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai quan sát từ log và phép đo backend.",
        "explanation": "Timeout và thời gian phản hồi là dữ liệu; chưa xác định căn nguyên CPU, cơ sở dữ liệu hay mạng.",
        "options": {
          "p1": [
            "Proxy timeout khi đọc upstream header.",
            "Log chỉ ra giai đoạn đang chờ."
          ],
          "p2": [
            "Yêu cầu health tới backend mất 31,4 giây.",
            "curl time_total đo tổng thời gian của yêu cầu đó."
          ],
          "over": [
            "Đổi timeout đã khôi phục tốc độ backend.",
            "Chưa có thay đổi hoặc phép đo sau thay đổi."
          ]
        }
      },
      "decision": {
        "prompt": "Nên phối hợp xử lý lỗi 504 giờ cao điểm thế nào?",
        "explanation": "Thu độ trễ, tài nguyên, dependency và request ID trước khi sửa nút thắt theo quyền.",
        "options": {
          "safe": [
            "Thu metrics và trace giờ cao điểm, rồi chuyển chủ ứng dụng.",
            "Chỉ đổi timeout theo SLA đã duyệt sau khi đánh giá tác động."
          ],
          "unsafe": [
            "Restart proxy hoặc tăng timeout vô hạn.",
            "Chưa giải quyết nguồn gây chậm và có thể tăng hàng đợi hoặc gián đoạn."
          ],
          "close": [
            "Đóng vì ngoài cao điểm không có 504.",
            "Cần thử dưới tải đại diện cho thời điểm lỗi."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp các bước xử lý API trả 504 vào giờ cao điểm.",
        "explanation": "Đo trong cửa sổ lỗi, thay đổi có quyền, rồi đo lại dưới tải tương đương.",
        "options": {
          "evidence": [
            "Thu độ trễ, tài nguyên và dependency theo request.",
            "Giúp phân biệt nghẽn ở ứng dụng, cơ sở dữ liệu hoặc mạng."
          ],
          "act": [
            "Chủ hệ thống duyệt cách sửa nút thắt hoặc timeout.",
            "Không tăng thời gian chờ chỉ để che nguyên nhân chưa rõ."
          ],
          "verify": [
            "Đo lại dưới tải tương đương và đối chiếu SLA, số lỗi 504.",
            "Dịch vụ active hoặc khỏe ngoài cao điểm chưa đủ."
          ]
        }
      }
    },
    "answerOverrides": {
      "expected_diagnosis": "Proxy timeout khi đọc header, một yêu cầu health tới backend mất 31,4 giây; độ trễ và số lỗi 504 tăng lúc cao điểm. Đường xử lý backend chậm, chưa xác định nút thắt cụ thể.",
      "recommended_next_checks": "Thu request ID, trace, p95/p99, hàng đợi và metrics tài nguyên, dependency cùng giờ cao điểm; so với timeout proxy.",
      "resolution_guidance": "Phối hợp chủ ứng dụng và cơ sở dữ liệu xử lý nút thắt theo quy trình thay đổi; chỉ chỉnh timeout sau khi đánh giá SLA và tác động.",
      "verification": "Dưới tải cao điểm đại diện, độ trễ đạt SLA, không còn 504 và backend ổn định trong cửa sổ theo dõi.",
      "escalate_when": "Chuyển nhóm ứng dụng, cơ sở dữ liệu hoặc capacity nếu vấn đề thuộc code, dependency hoặc tài nguyên ngoài quyền.",
      "production_warning": "Không tăng timeout vô hạn hoặc restart proxy lặp lại khi chưa khoanh vùng nguyên nhân."
    },
    "review": {
      "technical": "curl time_total trả số giây dạng thập phân; tương quan với tải cao chưa chứng minh nguyên nhân.",
      "editorial": "Viết lại toàn bộ lời dẫn, probe, câu hỏi, phản hồi và đáp án để loại bỏ từ bị dính.",
      "references": [
        "https://nginx.org/en/docs/",
        "https://curl.se/docs/manpage.html"
      ],
      "fixtureChanges": [
        {
          "probeId": "P2",
          "reason": "Định dạng curl time_total là số giây thập phân; giữ giá trị 31,4 giây với fixture 31.400000."
        }
      ]
    }
  },
  'VPS-07-003': {
    customerExplanation:'Sau deploy, các URL trả 404. Cần so đúng hostname, đường dẫn request và nơi release mới đặt nội dung.',
    hints:['404 là phản hồi HTTP, không tự chứng minh file bị xóa.','So document root với release path và thử đúng Host header.','Config trên disk có thể khác config đang chạy; xác nhận vhost trước reload được duyệt.'],
    verificationPrompt:'Ghi URL/Host, document root và file release. Nêu cách xác nhận vhost, quyền sửa và kiểm tra URL khách sau change.',
    probes:{P1:probe('Đọc phản hồi của URL /start.','Tái hiện đúng path bị lỗi sau deploy.','/start trả 404; chưa phân biệt thiếu file với root/route/vhost sai.'),P2:probe('Đọc cấu hình Nginx trên disk.','So root được khai báo với thư mục release.','Config khai báo /var/www/html; chưa chứng minh worker đang dùng bản config này.'),G1:probe('Kiểm tra file tại release path.','Phân biệt file chưa deploy với đường dẫn phục vụ không khớp.','File /srv/myapp/public/start tồn tại; vẫn cần đúng vhost và quyền đọc.'),G2:probe('Gửi request với Host example.com.','localhost có thể chọn default vhost khác site khách.','Host đúng vẫn 404; cần so vhost thực và release/config.')},
    questions:{
      triage:question('Sau deploy, khách gặp vấn đề gì ở các URL?', '404 là triệu chứng HTTP; nguyên nhân cần config và dữ liệu deploy.', {symptom:['Các trang trả 404 sau deploy.','Đây là kết quả khách quan sát được.'],other:['Trình duyệt báo chứng chỉ hết hạn.','Ticket không mô tả lỗi thời hạn TLS.'],cause:['Các file website đã bị xóa.','Root hoặc route sai cũng có thể trả 404.']}),
      check:question('Lệnh nào tái hiện status của /start ngay trong guest?', 'Gửi đúng path trước khi so config và file.', {direct:['curl -I http://localhost/start','curl đọc status HTTP của /start.'],wrong1:['nginx -T','Config dump không thay thế phép gửi request.'],wrong2:['free -h','RAM không cho biết HTTP status của URL.']}),
      output:question('Release có file /start nhưng root trên disk khác. Điều gì cần xác minh?', 'Sai khác path là giả thuyết mạnh; cần đúng vhost/config đang phục vụ trước sửa.', {supported:['Nghi root/vhost chưa khớp release.','File có ở release path nhưng request vẫn 404; cần runtime-vhost proof.'],over:['404 chứng minh file đã bị xóa.','File bổ sung vẫn tồn tại;404 có nhiều cách phát sinh.'],ignore:['File tồn tại nên site đã hoạt động.','Nginx có thể đọc root hoặc route khác.']}),
      evidence:question('Chọn hai quan sát từ request và config dump.', 'Status và cấu hình trên disk chưa tự xác nhận config runtime.', {p1:['/start trả 404 ở local.','Đây là status URL được hỏi.'],p2:['Config khai báo root /var/www/html.','Cần so đường dẫn này với release.'],over:['File /start đã bị xóa khỏi server.','Hai phép đầu chưa kiểm tra mọi release path.']}),
      decision:question('Sửa site 404 thế nào mà không ảnh hưởng nhầm vhost?', 'Xác nhận Host/vhost/release rồi test config và reload đúng quyền.', {safe:['Xác nhận vhost/path rồi sửa có phép.','Dùng nginx-t, rollback và kiểm tra URL sau reload.'],unsafe:['Xóa root cũ và reinstall Nginx.','Có thể mất dữ liệu, chưa giải quyết mapping.'],close:['Đóng ticket vì file release tồn tại.','URL khách vẫn 404; tồn tại file chưa đủ.']}),
    },
    answerOverrides:answer('URL /start trả 404, file có ở /srv/myapp/public còn config disk dùng /var/www/html. Nghi root/vhost không khớp release; cần xác nhận config runtime.', 'So Host/server_name, root/location/rewrite, config đang load và quyền đọc release.', 'Owner/admin sửa đúng server block, nginx-t và reload có duyệt/rollback; không xóa root để thử.', 'URL khách qua đúng hostname trả nội dung release mong muốn.', 'Chuyển site/app owner nếu router, nhiều vhost hoặc config runtime chưa rõ.', 'Không xóa document root hay reinstall khi chưa biết dữ liệu/site đang sử dụng.'),
    review:{technical:'Thu hẹp source root mismatch thành giả thuyết cần runtime-vhost proof.',editorial:'Riêng URL/Host/release, nhãn ngắn cân đối.',references:[refs.nginx],fixtureChanges:[{probeId:'P2',reason:'Guided base fixture thay cụm intended deploy trong source bằng server block Nginx; đây là cấu hình trên đĩa, chưa xác nhận runtime.'}]},
  },
  'VPS-07-004': {
    customerExplanation:'Domain trả 502. Cần phân biệt proxy đang chạy với backend mà proxy không kết nối được.',
    hints:['Nginx active vẫn có thể trả 502.','Đọc upstream endpoint trong error log.','Refused tới cổng 3000 có thể do backend dừng hoặc target sai; kiểm tra listener và config.'],
    verificationPrompt:'Ghi state proxy và upstream lỗi. Nêu cách so backend/config, quyền sửa và xác minh backend lẫn URL công khai.',
    probes:{P1:probe('Đọc state Nginx.','Tách proxy dừng khỏi proxy chạy nhưng lỗi backend.','active không kiểm tra backend3000.'),P2:probe('Đọc lỗi kết nối upstream.','502 cần khoanh đoạn proxy tới backend.','Kết nối127.0.0.1:3000 bị refused; cần listener/backend và upstream target để định nguyên nhân.')},
    questions:{
      triage:question('Khách đã nhận kết quả gì khi mở domain?', '502 là HTTP response; cần log upstream thay vì coi proxy không phản hồi.', {symptom:['HTTP502 Bad Gateway.','Đã nhận response ở lớp HTTP.'],other:['TCP hoàn toàn không kết nối được.','Khách đã nhận502, khác client refused.'],cause:['Restart Nginx chắc chắn sửa được.','Chưa biết backend hoặc upstream target.']}),
      check:question('Lệnh nào đọc systemd state của Nginx?', 'State proxy là một phép đọc; backend còn cần kiểm tra thêm.', {direct:['systemctl is-active nginx','Trả state của đúng unit.'],wrong1:['ss -ltnp','Đọc socket chứ không trả systemd state.'],wrong2:['journalctl -u nginx -n 50','Log cho biết sự kiện trước đó, không trả state systemd hiện tại.']}),
      output:question('Nginx active, upstream3000 refused. Nên khoanh lớp nào?', 'Backend endpoint không kết nối được; chưa biết backend dừng hay target sai.', {supported:['Backend listener và upstream target.','Kiểm tra hai phần này trước thay đổi service.'],over:['Restart proxy chắc chắn sửa backend.','Backend có thể là process khác chưa chạy.'],ignore:['Active nghĩa là upstream phải khỏe.','Proxy active vẫn có thể trả 502.']}),
      evidence:question('Chọn hai điều state và error log xác nhận.', 'State active không phủ định lỗi upstream đã ghi.', {p1:['Nginx hiện active.','systemctl is-active trả active.'],p2:['Upstream127.0.0.1:3000 refused.','Log ghi endpoint không kết nối được.'],over:['Restart proxy đã sửa backend.','Chưa có hành động hoặc kết quả backend.']}),
      decision:question('Nên xử lý502 theo bằng chứng hiện có thế nào?', 'Tìm listener/log backend và target rồi sửa đúng lớp có quyền.', {safe:['So listener/log và upstream target.','Owner duyệt sửa đúng backend/config rồi thử cả health và public URL.'],unsafe:['Restart proxy lặp lại để thử.','Có thể không tác động backend bị refused.'],close:['Đóng ticket vì Nginx active.','Khách vẫn nhận502.']}),
    },
    answerOverrides:answer('Nginx active nhưng upstream 127.0.0.1:3000 refused. Chưa phân biệt backend dừng với target sai.', 'Đọc listener3000, backend unit/log và proxy_pass cùng thời điểm request.', 'Owner/admin sửa đúng backend hoặc target theo change; start chỉ sau kiểm tra và quyền.', 'Backend health và URL công khai trả nội dung đúng, không còn502 trong cửa sổ kiểm tra.', 'Chuyển app/backend owner nếu ngoài quyền hoặc dependency bên thứ ba.', 'Không restart proxy liên tục để che lỗi backend chưa được xác định.'),
    review:{technical:'Refused không phân biệt stopped với target sai.',editorial:'Tách proxy/systemd/endpoint.',references:[refs.nginx],fixtureChanges:[]},
  },
  'VPS-07-006': {
    customerExplanation:'Website trả 503 ngay sau deploy. Cần kiểm tra app startup/config và readiness trước khi sửa proxy.',
    hints:['503 chưa chứng minh DNS hoặc Nginx syntax sai.','So HTTP local, app state và journal sau deploy.','Log thiếu APP_CONFIG: kiểm tra môi trường release, không lặp restart.'],
    verificationPrompt:'Ghi503, auto-restart và lỗi app. Nêu cách so release/config, quyền rollback/sửa và tiêu chí app ổn định.',
    probes:{P1:probe('Đọc HTTP status local.','Xác nhận503 xuất hiện trong đường phục vụ tại VPS.','Local503 chưa phân biệt proxy tạo lỗi với app chưa ready.'),P2:probe('Đọc state service app.','Crash/restart có thể làm backend không phục vụ.','activating(auto-restart) là đang thử khởi động lại, không phải readiness thành công.'),G1:probe('Đọc journal app sau deploy.','Cần startup error cụ thể trước change.','Process exit1 và thiếu APP_CONFIG; đối chiếu môi trường/secret với owner.')},
    questions:{
      triage:question('Mốc nào giúp chọn dữ liệu điều tra503?', 'Deploy là mốc so sánh, chưa tự kết luận nguyên nhân cụ thể.', {symptom:['503 bắt đầu ngay sau deploy.','So release/config và readiness cùng thời điểm.'],other:['Domain chưa có A record.','Khách đang nhận HTTP503, chưa có NXDOMAIN.'],cause:['Deploy chứng minh Nginx syntax sai.','Cần log app/proxy trước kết luận.']}),
      check:question('Phép nào tái hiện HTTP status ngay trên VPS?', 'Đọc response local trước khi so app state.', {direct:['curl -I http://127.0.0.1','Gửi request và đọc503.'],wrong1:['journalctl -u app -n 30 --no-pager','Đọc log app, không trực tiếp gửi HTTP.'],wrong2:['systemctl status app','State của app không trực tiếp tái hiện HTTP status của URL được hỏi.']}),
      output:question('503, auto-restart và missingAPP_CONFIG gợi hướng nào?', 'Startup config app đã có lỗi trong log; phải đối chiếu release/runtime.', {supported:['Config/release app và readiness.','Auto-restart cùng missing config chỉ vào startup chưa đúng.'],over:['Nginx chắc chắn sai cú pháp.','Không có nginx-t error, app journal lại nêu config thiếu.'],ignore:['Auto-restart nghĩa là app đã sẵn sàng.','Restart loop không chứng minh phục vụ request.']}),
      evidence:question('Chọn hai quan sát từ HTTP và app state.', 'Hai nguồn xác định triệu chứng, journal mới giúp đọc lý do startup.', {p1:['Local HTTP trả 503.','Có response Service Unavailable.'],p2:['App activating(auto-restart).','App chưa ổn định ởstate phục vụ.'],over:['Nginx syntax đã được kiểm tra sai.','Hai phép này không kiểm tra syntax Nginx.']}),
      decision:question('Làm gì khi release mới thiếu cấu hình app?', 'Đúng runtime/config hoặc rollback có quyền; sau đó kiểm tra ổn định và URL.', {safe:['So config/deploy rồi sửa hoặc rollback.','Theo runbook và owner approval, không đoán secret.'],unsafe:['Reload proxy và bỏ qua restart loop.','Không bổ sung được cấu hình app bị thiếu.'],close:['Đóng ticket sau một lần process chạy.','Cần readiness và theo dõi restart/HTTP sau change.']}),
      order:question('Sắp xếp phục hồi503 sau deploy.', 'Giữ lỗi/diff trước, change đúng quyền rồi kiểm tra app và website.', {evidence:['So HTTP, journal và deploy/config diff.','Khoanh startup failure và phạm vi release.'],act:['Sửa config hoặc rollback được duyệt.','Owner/runbook quyết định change và rollback.'],verify:['Đo app ổn định và URL trả đúng.','Một lần start chưa đủ kiểm chứng restart loop.']}),
    },
    answerOverrides:answer('App chưa khỏe sau deploy:503, auto-restart và journal thiếu APP_CONFIG. Chưa có bằng chứng Nginx syntax sai.', 'So unit environment, deploy diff, config và readiness với owner; bảo vệ secret.', 'App owner sửa đúng config/runtime hoặc rollback theo runbook/change.', 'Không còn restart loop, readiness và public URL tốt trong cửa sổ theo dõi.', 'Chuyển deployment/app owner nếu thiếu config/secret hoặc quyền rollback.', 'Không dán secret vào ticket hoặc reload proxy lặp lại để che startup failure.'),
    review:{technical:'Không coi503 là Nginx syntax; giữ app config failure.',editorial:'Deploy/readiness cụ thể.',references:[refs.nginx,refs.systemd],fixtureChanges:[]},
  },
  'VPS-06-007': {
    customerExplanation:'VM được báo Running nhưng web console chỉ hiện màn hình đen. Cần phân biệt đường console qua trình duyệt với tình trạng guest.',
    hints:['Màn hình đen không tự chứng minh kernel crash.', 'So VM state với lỗi websocket và sức khỏe console gateway.', 'Heartbeat QEMU chỉ nói process VM có mặt; kiểm tra guest qua đường khác và chuyển đội control-plane.'],
    verificationPrompt:'Ghi lỗi gateway, thời gian và tín hiệu VM. Nêu đội cần nhận sự cố, cách giữ nguyên workload khách và kiểm tra console/guest riêng sau xử lý.',
    probes:{P1:probe('Đọc VM state trong panel.','Cần biết VM đã tắt hay chỉ đường console có vấn đề.','Running là trạng thái VM; không chứng minh gateway hoặc guest OS khỏe.'),P2:probe('Đọc kết quả kết nối console gateway.','Web console dùng websocket qua gateway trước khi tới màn hình guest.','Handshake bị 502 cho biết đường console không mở được; chưa xác định guest có crash.'),G1:probe('Đọc tình trạng gateway cùng thời điểm.','Xem lỗi có ảnh hưởng rộng tới hạ tầng console không.','gateway-c2 degraded và38% websocket5xx lúc08:15 hỗ trợ lỗi gateway; cần incident/log để định nguyên nhân.'),G2:probe('Đọc heartbeat process VM từ host.','Một tín hiệu độc lập giúp tránh reset guest chỉ vì UI đen.','QEMU heartbeat hiện diện lúc08:16; chưa xác nhận guest boot hoặc app phản hồi.')},
    questions:{triage:question('Khách đang thấy sự khác biệt nào giữa panel và console?', 'VM state và hình ảnh console đi qua hai đường kiểm tra khác nhau.',{symptom:['Panel Running nhưng web console đen.','Đây là triệu chứng của đường truy cập console cần khoanh.'],other:['SSH báo sai mật khẩu.','Không có lần SSH xác thực nào trong lời khách.'],cause:['Màn hình đen chứng minh kernel guest đã crash.','Gateway, graphics hoặc guest đều có thể liên quan; chưa có log kernel.']}),check:question('Mục nào xác nhận panel đang báo VM ở trạng thái nào?', 'Đọc state trước, sau đó đối chiếu gateway và tín hiệu host để phân biệt các lớp.',{direct:['PANEL: VM state','Mục này trả trạng thái lifecycle của VM.'],wrong1:['PANEL: console gateway','Gateway cho biết đường console, không thay thế VM state.'],wrong2:['PANEL: QEMU heartbeat','Heartbeat process VM là tín hiệu host, không phải trạng thái lifecycle được hỏi.']}),output:question('Gateway degraded/502 nhưng QEMU còn heartbeat. Nên kết luận gì?', 'Bằng chứng ủng hộ sự cố đường web console; tình trạng guest và ứng dụng vẫn cần kiểm tra độc lập.',{supported:['Console lỗi; trạng thái guest còn chưa rõ.','Gateway lỗi rõ ràng trong khi heartbeat không phải bằng chứng guest crash hay khỏe.'],over:['Guest chắc chắn crash nên cần reset ngay.','Chưa có serial/kernel evidence và gateway lỗi đã được ghi nhận.'],ignore:['Heartbeat chứng minh khách dùng console bình thường.','Heartbeat process không kiểm tra websocket hoặc nội dung hiển thị.']}),evidence:question('Chọn hai quan sát về state VM và đường console.', 'Running không làm cho handshake502 trở thành thành công; hai nguồn có phạm vi khác nhau.',{p1:['Panel ghi Running.','Đây là state VM được panel báo.'],p2:['Websocket handshake thất bại với502.','Đường console qua gateway hiện chưa mở được.'],over:['Console đen đã xác nhận kernel panic.','Không có kernel panic log trong các nguồn này.']}),decision:question('Cách nào tránh gián đoạn VM khi lỗi đang ở đường console?', 'Chuyển đúng đội control-plane và kiểm tra guest riêng, giữ các phiên/workload đang hoạt động.',{safe:['Thu log gateway, chuyển đội control plane; kiểm tra guest.','Đúng lớp gateway được điều tra mà không reset workload thiếu căn cứ.'],unsafe:['Hard reset VM để sửa UI console.','Có thể mất dữ liệu và không sửa gateway502.'],close:['Đóng ticket vì VM Running và heartbeat có mặt.','Khách vẫn không dùng được console; guest/app cũng chưa được xác minh.']}),order:question('Sắp xếp việc điều tra web console đen nhưng VM còn Running.', 'So các lớp trước, xử lý gateway đúng quyền rồi xác minh cả console và guest.',{evidence:['So VM state, gateway lỗi và heartbeat theo thời gian.','Tránh quy lỗi guest từ một màn hình đen.'],act:['Chuyển control-plane xử lý gateway theo incident/change.','Đội hạ tầng console có quyền và dữ liệu để điều tra đúng lớp.'],verify:['Mở lại websocket/console; kiểm tra guest và dịch vụ riêng.','Console phục hồi không tự chứng minh app đã ổn.']})},
    answerOverrides:answer('Websocket console trả 502 và gateway degraded; heartbeat QEMU vẫn có. Đường web console lỗi, còn tình trạng guest OS/app chưa được xác minh đầy đủ.', 'Thu VM ID, gateway ID, timestamp, lỗi websocket và log gateway; kiểm tra serial/host console hoặc guest path được phép.', 'Chuyển control-plane/console team xử lý gateway; giữ workload đang chạy và tránh reset guest thiếu bằng chứng.', 'Websocket kết nối, console hiển thị; xác minh guest OS và dịch vụ khách cần dùng riêng.', 'Chuyển console/control-plane với dữ liệu cùng thời điểm; phối hợp virtualization nếu tín hiệu host/guest cũng bất thường.', 'Không hard reset VM chỉ vì console đen; đây có thể là lỗi đường truy cập trước guest.'),
    review:{technical:'Gateway502 và process heartbeat không xác minh kernel/app; escalation đúng control-plane.',editorial:'Làm rõ bất định thay phán guest crash.',references:[refs.libvirt],fixtureChanges:[]},
  },
  'VPS-06-008': {
    customerExplanation:'Khách đã yêu cầu shutdown nhưng panel còn Stopping sau 20 phút. Cần biết guest còn ghi dữ liệu hay xử lý tác vụ trước quyết định cưỡng bức.',
    hints:['Stopping là chuyển trạng thái chưa hoàn tất, không phải xác nhận đã tắt.', 'So thời gian gửi ACPI với console, tác vụ và disk I/O.', 'Không có phản hồi ACPI không cho phép hard stop an toàn; chuyển host team cùng owner đánh giá dữ liệu.'],
    verificationPrompt:'Ghi timeline shutdown, ACPI và dữ liệu I/O còn thiếu. Nêu quyền quyết định hard stop và cách kiểm tra VM/data/app sau recovery được duyệt.',
    probes:{P1:probe('Đọc trạng thái lifecycle và thời gian chờ.','Cần phân biệt shutdown đã hoàn tất với task đang chờ.','Stopping20m cho biết quá trình chưa hoàn tất trong panel; cần đối chiếu host.'),P2:probe('Đọc sự kiện shutdown từ QEMU.','Xem yêu cầu đã được gửi vào guest chưa.','ACPI đã gửi nhưng chưa thấy guest phản hồi; chưa biết process hoặc I/O nào đang chặn.'),G1:probe('Đối chiếu timeline yêu cầu và hoàn tất.','Xác nhận20phút chờ không chỉ là timestamp UI cũ.','Yêu cầu12:30, ACPI12:30:03, đến12:50 chưa có completion; cần điều tra, không tự hard stop.'),G2:probe('Đọc độ trễ ghi storage trong khoảng chờ.','Shutdown chậm có thể liên quan flush hoặc I/O cần bảo vệ.','p95 write latency210ms là tín hiệu cần host review; không chứng minh một process hoặc disk cụ thể hỏng.')},
    questions:{triage:question('Điều gì chưa hoàn thành sau yêu cầu shutdown?', 'Stopping20phút là một task chưa kết thúc; không được coi VM đã tắt chỉ vì lệnh đã gửi.',{symptom:['VM vẫn Stopping sau 20 phút.','Khách cần biết shutdown còn tiến triển và mức rủi ro dữ liệu.'],other:['DNS vừa đổi sang IP khác.','Không có dữ liệu DNS liên quan yêu cầu shutdown này.'],cause:['Guest không phản hồi nghĩa là có thể cắt điện an toàn.','Guest có thể còn ghi dữ liệu hoặc bị chặn I/O; chưa đủ điều kiện hard stop.']}),check:question('Mục nào cho biết shutdown task còn ở trạng thái nào?', 'Lifecycle state phải được đối chiếu với QEMU event và timeline, không chỉ thử lại cùng thao tác.',{direct:['PANEL: lifecycle','Mục này ghi Stopping và thời gian chờ.'],wrong1:['PANEL: storage latency','I/O giúp điều tra nguyên nhân chậm, không thay thế state task.'],wrong2:['PANEL: QEMU ACPI events','Event cho biết yêu cầu đã gửi, không thay trạng thái task đang chờ.']}),output:question('ACPI đã gửi nhưng completion vắng và I/O chậm. Điều nào đúng?', 'Yêu cầu đã tới đường host/guest nhưng chưa hoàn tất; cần thêm console/log và đánh giá dữ liệu trước cưỡng bức.',{supported:['Shutdown chưa xong; kiểm tra host và guest.','Timeline và I/O yêu cầu điều tra, không tự định mức an toàn của hard stop.'],over:['ACPI đã gửi nên virsh destroy không còn rủi ro.','destroy tương tự ngắt nguồn, có thể bỏ qua flush và làm lỗi dữ liệu.'],ignore:['Panel Stopping nghĩa là guest không còn ghi disk.','State chuyển tiếp không kiểm tra việc ghi dữ liệu trong guest.']}),evidence:question('Chọn hai điều về shutdown đã được panel/host ghi nhận.', 'State chờ và ACPI event là bằng chứng tiến độ, không phải kết luận guest đã an toàn để mất nguồn.',{p1:['Panel còn Stopping sau 20 phút.','Task chưa có kết quả hoàn tất được hiển thị.'],p2:['Host gửi ACPI nhưng chưa nhận guest completion.','Sự kiện này khác với việc guest đã shutdown sạch.'],over:['Hard stop lúc này bảo đảm filesystem không lỗi.','Chưa kiểm tra ghi dữ liệu, filesystem và tác vụ đang chạy.']}),decision:question('Support nên làm gì trước khi có người đề nghị hard stop?', 'Thu timeline, console/log và I/O rồi để đội có quyền cùng owner đánh giá rủi ro.',{safe:['Chuyển đội ảo hóa, storage cùng timeline I/O.','Đội host cần điều phối recovery và phê duyệt thao tác có thể mất dữ liệu.'],unsafe:['Tự destroy VM đang chờ flush để kết thúc task.','Cắt nguồn có thể phá dữ liệu đang ghi và vượt quyền support.'],close:['Đóng ticket vì yêu cầu ACPI đã được gửi.','Khách cần VM ở trạng thái ổn định; shutdown còn chưa hoàn tất.']}),order:question('Sắp xếp xử lý shutdown treo mà vẫn bảo vệ dữ liệu.', 'Điều tra và giữ bằng chứng, xin quyết định recovery đúng quyền, rồi xác minh dữ liệu sau sự cố.',{evidence:['Thu timeline, console/log và I/O đang diễn ra.','Biết mức tiến triển và dữ liệu còn có nguy cơ trước can thiệp.'],act:['Host team và owner duyệt phương án recovery theo rủi ro.','Force stop không phải lựa chọn support tự làm để hết task.'],verify:['Kiểm tra state ổn định, filesystem và chức năng ứng dụng.','Task hết Stopping chưa chứng minh dữ liệu nguyên vẹn.']})},
    answerOverrides:answer('Shutdown chưa hoàn tất: ACPI đã gửi nhưng không có completion sau 20 phút. Write latency cao là tín hiệu cần điều tra, chưa xác định nguyên nhân trong guest/host.', 'Thu timeline, console, guest/system logs, active writes và backup jobs; đối chiếu host task/storage metrics.', 'Chuyển virtualization/storage và owner đánh giá recovery. Chỉ đội có quyền quyết định thao tác cưỡng bức sau khi làm rõ rủi ro dữ liệu.', 'VM đạt trạng thái ổn định; kiểm tra filesystem, dữ liệu và ứng dụng sau recovery, không hứa không có corruption từ state panel.', 'Chuyển host/storage khi task không tiến triển, I/O cao hoặc cần quyết định mất nguồn có nguy cơ dữ liệu.', 'virsh destroy tương tự ngắt nguồn; không dùng để kết thúc Stopping khi chưa có quyền và đánh giá active writes.'),
    review:{technical:'ACPI delivered không bảo đảm dữ liệu đãflush; không hứa shutdown khôngcorruption.',editorial:'Timeline/IOrisk và quyềnforce stop được hỏi riêng.',references:[refs.libvirt],fixtureChanges:[]},
  },
  'VPS-07-001': {
    customerExplanation:'Website không mở và curl báo connection refused. Cần phân biệt TCP chưa kết nối được với web server đã trả mã lỗi HTTP.',
    hints:['Connection refused xảy ra trước khi có mã HTTP.', 'Xem trạng thái Nginx và listener cổng 80.', 'Nginx dừng chưa cho biết vì sao; xem log/cấu hình trước start có quyền và thử lại từ client.'],
    verificationPrompt:'Ghi trạng thái Nginx, listener HTTP và điều chưa biết về lý do dừng. Nêu điều kiện start và kiểm tra HTTP local/ngoài sau đó.',
    probes:{P1:probe('Đọc trạng thái Nginx.','Refused có thể do không có web service lắng nghe.','inactive(dead) cho biết Nginx hiện dừng, chưa cho biết nguyên nhân.','Active: inactive (dead)'),P2:probe('Liệt kê listener TCP trong guest.','Cần xem cổng 80 có thực sự được process nào mở không.','Danh sách không có:80; cổng22 hiện diện không chứng minh HTTP hoạt động.','State Recv-Q Send-Q Local Address:Port Peer Address:Port Process\nLISTEN 0 128 0.0.0.0:22 0.0.0.0:* users:(("sshd",pid=730,fd=3))'),G1:probe('Kiểm tra cú pháp cấu hình Nginx.','Trước khi đề xuất start cần biết config có lỗi cú pháp không.','Syntax test thành công; service vẫn có thể dừng vì lý do khác.'),G2:probe('Thử HTTP tới loopback.','Tách lỗi tại guest listener khỏi đường truy cập bên ngoài.','Local TCP/80 cũng refused; chưa có HTTP response để đánh giá nội dung website.')},
    questions:{triage:question('Connection refused khác HTTP403 ở điểm nào?', 'Refused là lỗi thiết lập kết nối TCP;403 chỉ xuất hiện sau khi đã nhận phản hồi HTTP.',{tcp:['TCP chưa kết nối được tới cổng web.','curl chưa nhận mãHTTP từ server.'],403:['Web server đã trả 403 Forbidden.','403 là một phản hồiHTTP, khác refused.'],dns:['Hostname chắc chắn NXDOMAIN.','curl báorefused không tự xác nhận lỗi phân giải tên.']}),check:question('Muốn biết Nginx đang chạy hay dừng, dùng lệnh nào?', 'Đọc trạng thái service trước, rồi đối chiếu listener và log.',{nginx:['systemctl status nginx','Lệnh status đọc state của Nginx.'],inode:['ss -ltnp','Socket có thể tồn tại hoặc vắng mặt, nhưng không trực tiếp đọc state của unit Nginx.'],dig:['journalctl -u nginx -n 50','Log giúp điều tra lý do dừng, không trực tiếp đọc state hiện tại.']}),output:question('Nginx inactive và không có listener cổng 80: điều gì đã được xác nhận?', 'Hai kết quả giải thích refused tại thời điểm đo nhưng chưa cho biết lý do Nginx dừng.',{stopped:['Web service đang dừng và HTTP chưa lắng nghe.','Service state và listener cùng phù hợp triệu chứng refused.'],reason:['Đã biết chính xác lý do Nginx dừng.','Cần log hoặc sự kiện liên quan, không suy từ inactive.'],disk:['Filesystem chắc chắn đầy.','Chưa có phép đo dung lượng hoặc log ENOSPC.']}),evidence:question('Chọn hai quan sát trực tiếp về webservice trong guest.', 'Tách trạng thái và listener khỏi giả thuyết nguyên nhân hoặc lỗi upstream.',{inactive:['Nginx hiện inactive.','systemctl ghi trạng thái hiện tại.'],port:['Không có listener TCP/80 trong danh sách.','ss không liệt kê cổng 80.'],config:['Nginx không khởi động do cấu hình sai cú pháp.','Lệnh nginx -t bổ sung thành công. Vì vậy lỗi cú pháp chưa được chứng minh là nguyên nhân Nginx dừng.'],upstream:['Nginx đã trả HTTP 502 vì upstream không phản hồi.','Tại thời điểm kiểm tra chưa có listener TCP/80 và curl local bị từ chối kết nối; không có response HTTP 502.']}),decision:question('Nên làm gì trước khi báo website đã hoạt động trở lại?', 'Xem lý do dừng, kiểm tra config và quyền; sau start cần thử HTTP ở guest và client.',{safe:['Xem log/config, start có phép rồi thử HTTP local và ngoài.','Vừa điều tra nguyên nhân vừa xác minh đúng triệu chứng website.'],instant:['Restart ngay rồi đóng ticket vì service active.','Chưa xác minh nguyên nhân, quyền hoặc HTTP sau hành động.'],reinstall:['Reinstall VPS để Nginx chạy lại.','Tác động phá hủy rộng, không cần thiết từ bằng chứng service dừng.']})},
    answerOverrides:answer('Nginx hiện dừng và guest không có listener cổng 80; local curl bị từ chối kết nối. Config syntax test thành công, lý do service dừng vẫn chưa rõ.', 'Đọc journal Nginx và thời điểm dừng; đối chiếu change/workload và quyền quản lý service.', 'Admin được phép start sau khi xem log/config và đánh giá tác động; không coi service active là web đã sửa xong.', 'Kiểm tra listener cổng 80, local HTTP và URL khách từ client; xác nhận nội dung đúng, không chỉ cổng mở.', 'Chuyển admin/app owner nếu service dừng lại, log không rõ hoặc ngoài phạm vi quản lý.', 'Không reinstall hoặc restart toàn VPS chỉ vì một service dừng; thay đổi cần đúng quyền.'),
    review:{technical:'Thay mô tả no80listener bằngbảngss; configtest khôngchứngminhservicehealthy.',editorial:'Ràmanualpilot,phânbiệtTCP/HTTP rõ.',references:[refs.nginx,'https://man7.org/linux/man-pages/man8/ss.8.html'],fixtureChanges:[{probeId:'P1',reason:'Đưa trạngthái vào dòngActive đúng kiểu systemctl thayfragment thiếu nhãn.'},{probeId:'P2',reason:'no :80 listener là mô tả; thay bảngss vớiSSHlistener, không cóHTTP.'}]},
  },
  'VPS-07-002': {
    customerExplanation: 'Website có phản hồi nhưng trả 403 Forbidden. Cần kiểm tra đúng site và quy tắc index/access, thay vì mặc định server đã dừng.',
    hints: ['403 là phản hồi HTTP, khác connection refused.', 'Đọc error log và cấu hình root/index của site.', 'Directory index forbidden chưa tự nói file index bị xóa; so nội dung deploy và quyền truy cập mong muốn.'],
    verificationPrompt: 'Ghi mã HTTP và đường dẫn trong error log. So root/index/access với owner, rồi kiểm tra trang mong muốn mà không mở listing không cần thiết.',
    probes: {
      P1: probe('Đọc mã HTTP từ web server local.', 'Xác định server đã phản hồi hay TCP còn lỗi.', 'HTTP403 cho biết request bị từ chối; chưa chỉ ra rule cụ thể.'),
      P2: probe('Đọc lỗi Nginx gần request403.', 'Log có thể chỉ đường dẫn và cơ chế index bị từ chối.', 'Directory index of /srv/site/ forbidden cần đối chiếu index/route/access; không tự cho phép bật listing.'),
    },
    questions: {
      triage: question('Website trả 403 cho biết truy cập đã đi tới đâu?', 'Server đã trả HTTP; cần điều tra lý do từ chối thay vì coi cổng chưa mở.', {symptom:['Web server phản hồi403 Forbidden.','Request tới server nhưng bị từ chối.'],other:['TCP hoàn toàn không kết nối được tới web server.','Đã có HTTP403 nên không phải refused hoàn toàn.'],cause:['403 chứng minh toàn bộ file website đã bị xóa.','403 có thể liên quan index/access; chưa đọc nội dung disk.']}),
      check: question('Lệnh nào đọc mã HTTP web server local trả?', 'curl-I đọc header HTTP, không kiểm tra file deploy hoặc quyền filesystem.', {direct:['curl -I http://127.0.0.1','Lệnh trả status/header để phân biệt403 với lỗi TCP.'],wrong1:['tail /var/log/nginx/error.log','Error log bổ sung nguyên nhân, không phải phép gửi request HTTP.'],wrong2:['free -h','RAM không cho biết HTTP status của site.']}),
      output: question('403 kèm directory index forbidden gợi điều gì cần kiểm tra?', 'Directory listing bị từ chối chưa xác nhận file index thiếu hoặc việc mở listing là đúng.', {supported:['So root/index và nội dung deploy trước khi đổi access.','Phải biết trang hoặc route owner muốn phục vụ ở thư mục đó.'],over:['Bật autoindex công khai luôn là cách sửa đúng.','Có thể lộ dữ liệu và không phục vụ trang ứng dụng mong muốn.'],ignore:['Nginx chắc chắn đã dừng hoàn toàn.','Nginx đã trả 403 và ghi error log.']}),
      evidence: question('Chọn hai thông tin hiện có từ HTTP và error log.', 'Status phản hồi và đường dẫn forbidden là quan sát; chưa cấp quyền mở listing.', {p1:['Local HTTP trả 403.','Có phản hồi ở lớp web server.'],p2:['Log ghi directory index /srv/site/ bị từ chối.','Cần đối chiếu đường dẫn với cấu hình và dữ liệu deploy.'],over:['Owner đã cho phép listing mọi thư mục.','Chưa có access policy hoặc approval cho autoindex.']}),
      decision: question('Sửa403 thế nào để không vô tình mở dữ liệu riêng tư?', 'Đối chiếu root, index, deploy và policy; chỉ đổi phạm vi owner duyệt.', {safe:['So root/index và deploy, sửa trang/route đúng theo owner.','Giữ access control và tránh mở directory listing rộng.'],unsafe:['Bật autoindex cho toàn bộ site production.','Có thể lộ file và không đáp ứng ý định ứng dụng.'],close:['Đóng ticket vì đã có phản hồi HTTP.','Khách cần trang hợp lệ, không phải403.']}),
    },
    answerOverrides: answer('Nginx trả 403 và log directory index /srv/site/ forbidden. Chưa đủ bằng chứng file index không tồn tại; root/index/route/access cần đối chiếu.', 'Đọc server block, request Host/path, nội dung deploy và quyền đường dẫn theo access mong muốn.', 'Owner/admin chọn index hoặc route đúng, sửa có phép và giữ access control; không bật autoindex chỉ để thử.', 'URL mong muốn trả nội dung đúng và không lộ listing hoặc file cần riêng tư.', 'Chuyển site owner/admin nếu access bị từ chối có chủ đích hoặc cấu hình route không rõ.', 'Không chmod777 hoặc mở listing toàn site để hết403; hết mã lỗi chưa đồng nghĩa đúng quyền.'),
    review: {technical:'Thu hẹp khẳng định thiếu index trong đáp án nguồn: directory forbidden chưa đủ chứng minh file thiếu.',editorial:'Câu hỏi riêng về403/index/access.',references:[refs.nginx],fixtureChanges:[]},
  },
})
Object.assign(topicEdits, {
  'VPS-06-002': {
    customerExplanation: 'VPS chậm và khách muốn reboot ngay. Cần hiểu công việc đang chạy và nguy cơ gián đoạn trước khi chọn thao tác.',
    hints: ['Yêu cầu reboot là đề xuất của khách; triệu chứng cần đo vẫn là độ chậm.', 'So trạng thái VM với CPU/process và tiến độ backup.', 'Backup đang chạy có thể dùng nhiều CPU nhưng chưa phải lỗi; hỏi tác động và cửa sổ công việc trước change.'],
    verificationPrompt: 'Ghi VM state, process dùng CPU và trạng thái backup. Nêu cách đo ảnh hưởng đến khách, trao đổi với owner và kiểm tra lại sau điều chỉnh được duyệt.',
    probes: {
      P1: probe('Xem máy ảo có đang chạy không.', 'Phân biệt máy tắt với máy đang chạy nhưng phản hồi chậm.', 'Running không đo được tốc độ ứng dụng hoặc chất lượng backup.'),
      P2: probe('Lấy ảnh chụp CPU và process.', 'Cần biết trong lúc chậm, CPU dành cho workload nào.', 'CPU user cao và mariabackup PID2418 dùng 94,7%; một mẫu chưa chứng minh job bất thường.'),
      G1: probe('Đọc tiến độ backup database.', 'Reboot giữa backup có thể làm job thất bại và tăng rủi ro vận hành.', 'Task chạy từ02:00, tiến độ72%; cần hỏi owner mức ảnh hưởng và theo dõi tiến triển.'),
    },
    questions: {
      triage: question('Khách yêu cầu reboot vì chậm: đâu là triệu chứng cần điều tra?', 'Một yêu cầu hành động không thay thế phép đo; cần xác định độ chậm và dịch vụ bị ảnh hưởng.', {symptom:['VPS chậm trong khi khách muốn reboot ngay.','Độ chậm là vấn đề cần làm rõ; reboot chưa được chứng minh cần thiết.'],other:['VM đã tắt và cần bật nguồn.','Khách mô tả chậm, chưa báo Powered Off.'],cause:['Reboot chắc chắn sửa được nguyên nhân.','Chưa biết workload hoặc nguyên nhân nên không bảo đảm kết quả reboot.']}),
      check: question('Trước khi đánh giá workload, mục nào xác nhận máy ảo còn chạy?', 'Panel power state trả lời việc VM còn bật; process và backup cần các phép đo khác.', {direct:['PANEL: VM state','Mục này phân biệt Running với Powered Off.'],wrong1:['PANEL: backup job state','Tiến độ backup không thay cho trạng thái nguồn VM hiện tại.'],wrong2:['top -b -n1 | head','top đo hoạt động trong guest, không phải nguồn quản lý lifecycle của VM.']}),
      output: question('VM Running, mariabackup dùng nhiều CPU và job mới hoàn thành72%. Nên nhận định thế nào?', 'Có một workload nặng đang chạy; cần xác nhận nó có đúng kế hoạch và có làm chậm dịch vụ trước khi can thiệp.', {supported:['Backup đang dùng CPU; chưa nên reboot.','Snapshot và task cùng cho thấy backup hoạt động nhưng không xác định job bị lỗi.'],over:['CPU cao chứng minh database đã hỏng.','CPU sử dụng nhiều không kiểm tra được tính toàn vẹn database.'],ignore:['Running nghĩa là ứng dụng không thể bị chậm.','Trạng thái nguồn không đo latency hay tài nguyên của ứng dụng.']}),
      evidence: question('Chọn hai quan sát trực tiếp về VM và tải CPU.', 'Phân biệt trạng thái máy ảo với tải process; cả hai chưa tự đưa ra quyết định reboot.', {p1:['Panel ghi VM Running.','Đây là trạng thái nguồn được quản lý bởi panel.'],p2:['mariabackup đang dùng 94,7% CPU trong mẫu.','top liệt kê process backup nổi bật tại thời điểm đo.'],over:['Database đã mất dữ liệu vì CPU cao.','Không có integrity check hoặc bản ghi dữ liệu mất trong các phép đo này.']}),
      decision: question('Bước nào phù hợp khi backup còn chạy và khách đang bị chậm?', 'Đo ảnh hưởng, theo dõi job và trao đổi owner trước thay đổi; không cắt ngang backup chỉ để thử.', {safe:['Đo độ trễ; cùng owner xem xét backup.','Kết hợp nhu cầu dịch vụ với tiến độ backup giúp chọn change có kiểm soát.'],unsafe:['Reboot ngay dù backup chưa hoàn thành.','Có thể cắt dịch vụ và làm backup thất bại mà chưa xử lý nguồn tải.'],close:['Đóng ticket vì backup đang chạy là bình thường.','Workload có thể hợp lệ nhưng mức ảnh hưởng khách báo vẫn cần đo và giải quyết.']}),
    },
    answerOverrides: answer('VM đang Running; mariabackup dùng nhiều CPU trong lúc task backup đạt 72%. Workload có thể liên quan độ chậm, chưa chứng minh cần reboot hoặc dữ liệu lỗi.', 'Đo latency của dịch vụ, xu hướng CPU/I/O và tiến độ backup; hỏi owner lịch và mức ảnh hưởng chấp nhận được.', 'Phối hợp owner điều chỉnh lịch hoặc tài nguyên theo change được duyệt. Chỉ cân nhắc reboot nếu có lý do riêng, kế hoạch gián đoạn và quyền rõ ràng.', 'So latency dưới tải tương đương; kiểm tra backup hoàn thành và dịch vụ hoạt động đúng sau điều chỉnh.', 'Chuyển owner database/backup nếu job không tiến triển, dịch vụ quan trọng suy giảm hoặc quyền can thiệp chưa rõ.', 'Reboot giữa backup có thể gián đoạn dịch vụ và làm job thất bại; yêu cầu của khách cần được xác thực và đánh giá tác động.'),
    review: {technical:'Không suy corruptDB/reboot từCPU snapshot; xác minh tác động backup và latency.',editorial:'Viết riêng5câu và ngữ cảnh workload/owner.',references:[refs.libvirt,'https://man7.org/linux/man-pages/man1/top.1.html'],fixtureChanges:[]},
  },
  'VPS-06-003': {
    customerExplanation: 'Khách không còn biết mật khẩu root. Quy trình khôi phục phải xác minh chủ tài khoản và tránh làm lộ thông tin đăng nhập.',
    hints: ['Quên mật khẩu không đồng nghĩa dịch vụ SSH hoặc VPS bị hỏng.', 'Kiểm tra có console và image nào, nhưng đừng đồng nhất truy cập panel với quyền reset.', 'Ownership review còn pending; chuyển quy trình xác minh trước khi khôi phục credential.'],
    verificationPrompt: 'Ghi đường console và image được panel ghi nhận. Nêu bước xác minh owner, quy trình khôi phục được duyệt và cách khách xác nhận login mà không gửi mật khẩu qua ticket.',
    probes: {
      P1: probe('Xem console có mở được qua panel không.', 'Console là một đường phục hồi có thể dùng sau khi xác minh quyền.', 'Accessible chỉ nói đường console sẵn có; không tiết lộ mật khẩu hoặc tự cấp quyền reset.'),
      P2: probe('Đọc template OS được gán cho VPS.', 'Runbook recovery khác nhau theo OS/image nên cần đối chiếu trước thao tác.', 'Panel ghi CentOS Stream 9; vẫn nên xác minh guest thực nếu cần dùng rescue runbook.'),
      G1: probe('Đọc trạng thái xác minh người yêu cầu.', 'Thay credential đặc quyền phải dựa trên ownership đã kiểm tra.', 'Identity review đang pending; chưa được tiến hành reset. '),
    },
    questions: {
      triage: question('Khách đang cần hỗ trợ loại vấn đề nào?', 'Đây là khôi phục thông tin truy cập đặc quyền, cần kiểm tra danh tính trước thao tác.', {symptom:['Khách không còn biết mật khẩu root.','Mục tiêu là khôi phục truy cập hợp lệ, không mặc định hệ thống đã hỏng.'],other:['VPS mất volume dữ liệu sau migration.','Ticket không báo mất disk hoặc dữ liệu.'],cause:['Mật khẩu bị mất chứng minh server đã bị xâm nhập.','Quên credential chưa phải bằng chứng compromise; cần hỏi bối cảnh nếu có dấu hiệu khác.']}),
      check: question('Muốn biết còn đường console phục vụ recovery hay không, xem gì?', 'Console availability là thông tin về đường truy cập; quyền khôi phục phải được xác minh riêng.', {direct:['PANEL: console','Mục console cho biết đường truy cập ngoài SSH có sẵn.'],wrong1:['getent passwd root','Tra account không xác minh console có mở được hay không.'],wrong2:['PANEL: OS template','Template giúp chọn runbook, không cho biết console hiện sẵn có.']}),
      output: question('Có console, template CentOS và ownership pending. Điều nào đã đủ căn cứ?', 'Hạ tầng có thể hỗ trợ recovery nhưng danh tính vẫn đang được kiểm tra; không tiến hành reset khi chưa được ủy quyền.', {supported:['Có đường recovery; chưa đủ quyền đổi mật khẩu.','Console và OS là điều kiện kỹ thuật; ownership pending vẫn chặn thao tác đặc quyền.'],over:['Console mở được nghĩa là support được reset ngay.','Quyền kỹ thuật truy cập panel không thay cho authorization của chủ VPS.'],ignore:['Console Accessible chứng minh mật khẩu root hiện vẫn đúng.','Availability của console không kiểm tra credential của user.']}),
      evidence: question('Chọn hai thông tin kỹ thuật mà panel đã cung cấp.', 'Hai mục đầu giúp chuẩn bị runbook, không chứng minh danh tính hoặc mật khẩu.', {p1:['Console được báo Accessible.','Đây là trạng thái của đường console trong panel.'],p2:['Template được ghi là CentOS Stream 9.','Tên image hỗ trợ chọn quy trình phù hợp sau khi đối chiếu guest.'],over:['Console Accessible đã phê duyệt yêu cầu reset.','Phê duyệt identity nằm ở quy trình khác và hiện còn pending.']}),
      decision: question('Nên chuyển tiếp yêu cầu quên root password thế nào?', 'Xác minh owner trước, rồi dùng kênh recovery được duyệt và cơ chế bàn giao secret an toàn.', {safe:['Xác minh owner rồi theo quy trình recovery.', 'Đội được ủy quyền mới thực hiện reset theo policy và điều kiện dữ liệu.'],unsafe:['Reset ngay và dán mật khẩu mới vào ticket.', 'Thiếu xác minh và kênh secret an toàn có thể cấp đặc quyền cho sai người.'],close:['Đóng ticket vì console đã mở được.', 'Khách chưa khôi phục được login; console availability không phải kết quả cuối.']}),
    },
    answerOverrides: answer('Console sẵn có và panel ghi CentOS Stream 9, nhưng ownership review đang pending. Chưa đủ điều kiện thay mật khẩu root.', 'Xác minh người yêu cầu và serviceID; đối chiếu guest/image, dữ liệu quan trọng và runbook recovery được phép.', 'Đội được ủy quyền thực hiện recovery theo policy sau khi ownership được duyệt. Dùng kênh secret phù hợp, yêu cầu đổi credential tạm nếu có.', 'Khách xác nhận login hợp lệ qua đường dự kiến; kiểm tra audit và thu hồi quyền/tài khoản tạm theo policy.', 'Chuyển đội account/security khi identity không rõ hoặc thất bại; chuyển admin recovery nếu cần thao tác rescue ngoài quyền support.', 'Không reset đặc quyền cho yêu cầu chưa xác minh hoặc gửi password/private key trực tiếp trong ticket.'),
    review:{technical:'Console khôngphải authorization; recovery phụ thuộcOS và quyềnowner.',editorial:'Tách điều kiệnkỹ thuật,identity và kết quảlogin.',references:[refs.libvirt,refs.ssh],fixtureChanges:[]},
  },
  'VPS-06-004': {
    customerExplanation: 'Khách muốn cài Ubuntu nhưng VPS chứa dữ liệu quan trọng. Cần làm rõ dữ liệu sẽ mất và có bản phục hồi dùng được trước mọi reinstall.',
    hints:['Cài lại OS không chỉ là đổi package manager.','Đọc phạm vi ghi đè và danh sách backup trước khi đề xuất thao tác.','Không có backup gần đây và chưa có restore test: cần phương án dữ liệu, không chỉ câu đồng ý chung.'],
    verificationPrompt:'Ghi dữ liệu trên disk nào bị ảnh hưởng, backup/restore test còn thiếu và quyền phê duyệt. Nếu sau này reinstall được duyệt, nêu cách kiểm tra OS, mạng và dữ liệu đã di chuyển.',
    probes:{P1:probe('Đọc cảnh báo phạm vi ghi đè khi reinstall.','Cần biết yêu cầu đổiOS có phá nội dung main disk hay không.','Panel cảnh báo toàn bộ main disk bị ghi đè; không thể hứa giữ /home hoặc database.'),P2:probe('Đọc danh sách backup gần đây.','Dữ liệu quan trọng cần phương án phục hồi trước thay đổi phá hủy.','Không tìm thấy backup gần đây trong catalog; chưa có cơ sở cam kết phục hồi.'),G1:probe('Kiểm tra có bản ghi restore test không.','Một backup được liệt kê vẫn cần kiểm chứng khả năng phục hồi.','Không có verified restore test trong hồ sơ; cần tạo/kiểm tra bản sao theo quy trình.')},
    questions:{
      triage:question('Yêu cầu đổi sang Ubuntu có điểm nào cần giải quyết trước thao tác?', 'Khách vừa muốn reinstall vừa cần bảo vệ dữ liệu; hai nhu cầu phải được thống nhất rõ.',{symptom:['ĐổiOS nhưng giữ an toàn dữ liệu quan trọng.','Cần làm rõ dữ liệu và phương án migration/backup trước reinstall.'],other:['Chỉ thay package manager trên OS hiện có.','ReinstallOS có thể ghi đè disk, không phải chỉ đổi công cụ quản lý package.'],cause:['Nhắc Ubuntu đã đủ xác nhận mọi dữ liệu được phép xóa.','TênOS không phải sự chấp thuận có hiểu biết về phạm vi dữ liệu mất.']}),
      check:question('Mục nào trực tiếp cho biết reinstall sẽ ghi đè những gì?', 'Phải đọc cảnh báo thao tác trước khi xem xét điều kiện backup và quyền.',{direct:['PANEL: OS reinstall confirmation','Cảnh báo nêu main disk sẽ bị ghi đè.'],wrong1:['PANEL: backup list','Danh sáchbackup cho biết khả năng có bản sao, không mô tả phạm vi reinstall.'],wrong2:['PANEL: OS template','Template đích không xác định dữ liệu nào được giữ trong quá trình reinstall.']}),
      output:question('Main disk sẽ bị ghi đè, không có backup gần đây. Bạn nên kết luận gì?', 'Đây là nguy cơ mất dữ liệu đã nêu rõ; cần dừng trước thao tác và thống nhất phương án phục hồi.',{supported:['Chưa reinstall khi chưa xác minh backup.','Main disk có nguy cơ mất nội dung còn backup gần đây không được tìm thấy.'],over:['Reinstall giữ nguyên /home và database.', 'Cảnh báo ghi đè toàn main disk không có ngoại lệ giữ các thư mục này.'],ignore:['Khách yêu cầu đổiOS nên backup không còn cần thiết.','Dữ liệu quan trọng vẫn cần được bảo vệ và owner hiểu rõ phạm vi mất.']}),
      evidence:question('Chọn hai dữ kiện khiến yêu cầu reinstall phải dừng để làm rõ dữ liệu.', 'Rủi ro ghi đè và thiếu bản sao đã được kiểm tra là hai vấn đề tách biệt cần xử lý.',{p1:['Panel cảnh báo main disk sẽ bị ghi đè.','Đây là tác động trực tiếp của thao tác reinstall.'],p2:['Catalog không tìm thấy backup gần đây.','Chưa có bằng chứng về điểm phục hồi đủ mới.'],over:['Reinstall mặc định bảo toàn dữ liệu trong /home.','Không có cam kết đó; cảnh báo hiện nói toàn main disk.']}),
      decision:question('Support nên trả lời trước khi thực hiện yêu cầu Ubuntu thế nào?', 'Giải thích cụ thể phạm vi xóa, kiểm tra bản sao và quyền; không áp dụng thay đổi phá hủy chỉ từ một yêu cầuOS.',{safe:['Kiểm tra dữ liệu, backup và phê duyệt.', 'Đây là điều kiện để owner quyết định migration hoặc reinstall có hiểu biết.'],unsafe:['Bấm reinstall ngay vì khách đã nêu tênOS.', 'Có thể mất dữ liệu khách muốn giữ mà chưa có bản phục hồi.'],close:['Đóng ticket sau khi báo reinstall có thể làm mất dữ liệu.', 'Cần thống nhất bước tiếp theo; cảnh báo đơn thuần chưa giải quyết yêu cầu.']}),
    },
    answerOverrides:answer('Reinstall sẽ ghi đè main disk và chưa có backup gần đây/restore test trong hồ sơ. Yêu cầu Ubuntu chưa đủ để chấp thuận mất dữ liệu.', 'Xác nhậnserviceID,OS đích, dữ liệu cần giữ, disk bị ảnh hưởng và điểm phục hồi đã kiểm tra.', 'Dừng trước reinstall; thống nhất migration hoặc backup/restoretest và phê duyệt cụ thể của owner rồi mới chuyển đội có quyền.', 'Nếu được duyệt về sau, kiểm traOS, đăng nhập, mạng và dữ liệu/dịch vụ theo phạm vi migration; không coiOS boot là dữ liệu đã phục hồi.', 'Chuyển owner/admin/backup khi dữ liệu chưa được sao lưu, quyền không rõ hoặc cần phương ánmigration thay reinstall.', 'Reinstall ghi đè disk là thay đổi phá hủy; không hứa giữ/home hoặc database nếu không có quy trình đã kiểm chứng.'),
    review:{technical:'Cảnhbáoghiđè+thiếubackup; restoretest khác tồn tạiartifact.',editorial:'Viết rõ yêu cầu vàinformed approval thay warningchung.',references:[refs.libvirt],fixtureChanges:[]},
  },
  'VPS-06-005': {
    customerExplanation: 'Panel báo VM chạy nhưng console vào emergency mode khi mount /data. Cần so filesystem được cấu hình với volume đang gắn.',
    hints: ['Running không bảo đảm guest đã boot xong.', 'So UUID trong fstab với blkid và inventory volume.', 'UUID không khớp chưa giải thích nguyên nhân; xác nhận đúng volume và backup trước sửa.'],
    verificationPrompt: 'Ghi lỗi mount, UUID cấu hình và thiết bị hiện có. Nêu cách xác nhận đúng volume, quyền sửa và kiểm tra boot, mount, dữ liệu sau recovery.',
    probes: {
      P1: probe('Đọc lỗi boot trên console.', 'Xác định guest dừng ở bước nào dù panel báo Running.', 'Console báo mount /data thất bại và emergency mode; VM chưa boot bình thường.'),
      P2: probe('Đọc cấu hình mount tự động.', 'Lỗi có thể do UUID không khớp volume hiện có.', '/data tham chiếu UUID deadbeef; chưa biết là cấu hình cũ hay thiếu đúng volume.'),
      G1: probe('Đọc UUID và loại filesystem hiện có.', 'So định danh thiết bị với fstab trước khi sửa.', 'Không thiết bị được liệt kê có UUID deadbeef; cần xác định đúng volume dữ liệu.', '/dev/vda1: UUID="f2b1d098-6d41-4af5-9b31-6c6a1d08c201" TYPE="ext4"\n/dev/vdb1: UUID="cafe1234-4265-4e01-9310-71aa58e0b100" TYPE="ext4"'),
      G2: probe('Đối chiếu volume gắn vào VM.', 'Có vdb chưa bảo đảm đó là volume fstab cần dùng.', 'Inventory có vol-72 dạng vdb; phải đối chiếu ID và dữ liệu với owner.'),
    },
    questions: {
      triage: question('VM Running nhưng console emergency mode: vấn đề thuộc lớp nào?', 'Power state và tiến trình boot guest là hai lớp khác nhau.', {symptom:['Guest chưa boot bình thường, đang ở emergency mode.','Panel Running không bảo đảm mount và service hoàn thành.'],other:['Chỉ Nginx trả 404 khi OS đã hoạt động bình thường.','Console báo lỗi boot rộng hơn một URL web.'],cause:['Data disk chắc chắn hỏng và phải format.','Lỗi mount có thể do tham chiếu hoặc attachment; chưa kiểm tra integrity.']}),
      check: question('Phép nào đọc lỗi đang xuất hiện trên console?', 'Đọc điểm dừng boot trước khi so mount config và thiết bị.', {direct:['PANEL: VNC','Console hiển thị Failed to mount /data và emergency mode.'],wrong1:['cat /etc/fstab','fstab là cấu hình mong muốn, không phải nội dung console.'],wrong2:['PANEL: volume inventory','Inventory cho biết volume gắn, không hiển thị lỗi đang xuất hiện trên console.']}),
      output: question('fstab dùng deadbeef nhưng blkid không có UUID đó. Cần xác minh gì?', 'Sai khác định danh đã rõ; phải tìm đúng volume trước khi sửa UUID hoặc khôi phục attachment.', {supported:['Mount /data lỗi; cần so UUID với volume.','Đối chiếu config, thiết bị và inventory để tránh mount nhầm.'],over:['Chỉ là lỗi gõ nên bỏ /data vĩnh viễn.','Chưa biết dữ liệu và phụ thuộc của /data; bỏ entry có thể làm app ghi nhầm.'],ignore:['Panel Running chứng minh /data đã mount đúng.','Console đang báo mount thất bại, trái với kết luận này.']}),
      evidence: question('Chọn hai dữ kiện từ console và fstab về lỗi boot.', 'Console nêu điểm dừng; fstab nêu định danh được yêu cầu.', {p1:['Boot báo Failed to mount /data và emergency mode.','Đây là lỗi trực tiếp trên console.'],p2:['fstab tham chiếu UUID deadbeef cho /data.','Định danh này cần so với thiết bị thực.'],over:['Dữ liệu /data chắc chắn không còn cần thiết.','Không có xác nhận owner hay ứng dụng cho phép bỏ volume.']}),
      decision: question('Cách nào tránh gắn nhầm hoặc phá dữ liệu khi phục hồi /data?', 'Xác nhận volume, backup và quyền trước change; chuyển storage nếu thiếu disk hoặc nghi lỗi dữ liệu.', {safe:['So UUID, backup; chuyển storage khi cần.','Đúng định danh và rollback là điều kiện trước thay đổi mount.'],unsafe:['Xóa entry fstab hoặc format để guest boot nhanh.','Có thể mất dữ liệu hoặc để app ghi vào sai disk.'],close:['Đóng ticket ngay khi thấy VM Running.','Guest còn emergency mode, chưa xác minh mount hoặc dữ liệu.']}),
      order: question('Sắp xếp việc phục hồi mount /data khi UUID không khớp.', 'Xác định đúng thiết bị, change có quyền, rồi kiểm tra chức năng sau phục hồi.', {evidence:['So console, fstab, UUID và volume ID.','Tránh thay UUID chỉ vì một disk bất kỳ xuất hiện.'],act:['Owner/admin duyệt và thực hiện recovery có rollback.','Đổi config hoặc attachment cần đúng quyền và bảo toàn dữ liệu.'],verify:['Kiểm tra boot, mount /data và dữ liệu ứng dụng.','Boot thành công chưa chứng minh app dùng đúng volume.']}),
    },
    answerOverrides: answer('Guest dừng ở mount /data. UUID deadbeef trong fstab không có trong blkid; vol-72 đang gắn nhưng cần xác nhận đúng volume.', 'So UUID, volume ID, attachment và dữ liệu mong đợi; đọc boot journal và kiểm tra backup.', 'Sửa fstab chỉ sau khi xác minh đúng volume và được phê duyệt. Chuyển storage nếu attachment hoặc integrity chưa rõ; giữ rollback.', 'Guest boot bình thường, /data mount đúng volume, dữ liệu đọc được và app dùng đúng path.', 'Chuyển storage/virtualization khi thiếu disk, mapping không rõ hoặc có lỗi I/O/integrity.', 'Không format hoặc xóa entry /data chỉ để boot; có thể mất dữ liệu hoặc làm app ghi vào OS disk.'),
    review: {technical:'Phân biệt UUID cũ với gắn sai volume; sửa dạng UUID ext4 trong blkid.',editorial:'Câu hỏi về boot/mount giữ giới hạn kết luận.',references:['https://man7.org/linux/man-pages/man8/blkid.8.html','https://man7.org/linux/man-pages/man5/fstab.5.html'],fixtureChanges:[{probeId:'G1',reason:'f2b1-root/cafe1234 không có dạng UUID ext4; thay bằng UUID 36 ký tự, vẫn không khớp deadbeef.'}]},
  },
  'VPS-06-006': {
    customerExplanation: 'Máy luôn vào rescue thay vì OS đã cài. Cần kiểm tra nguồn boot và công việc recovery còn đang thực hiện.',
    hints: ['Boot vào rescue không chứng minh OS disk đã mất.', 'So ISO đang gắn, boot order và lịch sử recovery.', 'Ticket recovery còn mở; phối hợp đội phụ trách trước khi tháo ISO hoặc đổi nguồn boot.'],
    verificationPrompt: 'Ghi ISO, boot order và trạng thái recovery. Nêu điều kiện đổi nguồn boot, rồi kiểm tra OS, volume và dịch vụ khách sau change.',
    probes: {
      P1: probe('Xem ISO rescue còn đang gắn không.', 'ISO có thể được giữ lại từ công việc phục hồi.', 'Rescue ISO mounted phù hợp việc vào rescue; không đánh giá dữ liệu OS disk.'),
      P2: probe('Đọc thứ tự thiết bị boot.', 'ISO được ưu tiên khi optical đứng trước disk.', 'Optical before disk kết hợp ISO đang gắn giải thích đường boot hiện tại.'),
      G1: probe('Đọc tài khoản gắn ISO và ticket liên quan.', 'Không được ngắt recovery của đội khác.', 'Recovery-team gắn ISO lúc07:40, REC-420 còn mở; cần xác nhận công việc đã xong.'),
      G2: probe('Kiểm tra OS disk trong inventory.', 'Cần đúng disk và trạng thái sẵn sàng trước đổi nguồn boot.', 'OS disk 40 GiB đang gắn nhưng health check pending; chưa chứng minh boot được.'),
    },
    questions: {
      triage: question('Khách muốn VM boot vào đâu thay vì môi trường hiện tại?', 'Mục tiêu là OS đã cài; chọn nguồn boot và kiểm tra disk là hai việc riêng.', {symptom:['Boot OS đã cài thay vì rescue.','Khách thấy sai môi trường, chưa biết OS disk có vấn đề gì.'],other:['Chỉ sửa một URL trả 503.','Ticket nói môi trường boot, không phải mã HTTP của ứng dụng.'],cause:['OS disk đã bị xóa vì máy vào rescue.','ISO và boot order có thể dẫn tới rescue dù disk vẫn còn.']}),
      check: question('Mục nào cho biết rescue ISO còn được gắn?', 'Nguồn boot và boot order thuộc cấu hình VM, cần đọc trước thao tác guest.', {direct:['PANEL: boot source','Mục này ghi Rescue ISO mounted.'],wrong1:['PANEL: OS disk inventory','Inventory disk không cho biết ISO đang được ưu tiên.'],wrong2:['PANEL: recovery history','Lịch sử recovery cho biết ai dùng rescue, không xác nhận ISO hiện còn gắn.']}),
      output: question('ISO đứng trước disk, recovery còn mở. OS disk đã được xác minh đến đâu?', 'Đường boot rescue đã rõ; recovery và disk health chưa hoàn tất nên không tự đổi boot.', {supported:['Boot order dẫn vào rescue; xác minh trước khi đổi.','Ticket còn mở và disk health pending, không có kết luận mất disk.'],over:['OS trên disk chắc chắn đã mất.','Inventory vẫn có disk; ISO ưu tiên có thể ngăn boot từ disk.'],ignore:['Disk còn trong inventory nên chắc chắn boot khỏe.','Có disk không chứng minh bootloader, filesystem và service khỏe.']}),
      evidence: question('Chọn hai cấu hình đang dẫn VM vào rescue.', 'ISO gắn và optical ưu tiên phù hợp triệu chứng; kiểm tra health disk là việc khác.', {p1:['Rescue ISO đang được gắn.','Panel boot source cho biết ISO có sẵn cho VM.'],p2:['Optical được thử trước OS disk.','Boot order ưu tiên thiết bị chứa ISO.'],over:['OS disk đã mất toàn bộ partition.','Hai cấu hình boot không đọc partition hoặc integrity.']}),
      decision: question('Trước khi rời rescue, support cần phối hợp thế nào?', 'Đội recovery/ảo hóa xác nhận công việc hoàn tất và disk sẵn sàng trước change.', {safe:['Xác nhận recovery trước khi đổi boot order.','Giữ đúng quyền và tránh ngắt công việc phục hồi.'],unsafe:['Tự tháo ISO và ép reboot ngay.','Có thể ngắt recovery hoặc boot disk chưa sẵn sàng.'],close:['Đóng ticket vì OS disk vẫn có trong inventory.','Khách chưa vào OS và dịch vụ dự kiến.']}),
      order: question('Sắp xếp việc trả VM từ rescue về OS đã cài.', 'Xác nhận mục đích rescue và disk trước change, rồi kiểm tra OS và dịch vụ.', {evidence:['So ISO, boot order, recovery ticket và disk health.','Biết rescue còn cần và disk đã đủ điều kiện boot chưa.'],act:['Đội có quyền đổi nguồn boot theo change được duyệt.','Tháo ISO hoặc đổi boot có thể ảnh hưởng recovery.'],verify:['Xác nhận OS đúng, volume và dịch vụ hoạt động.','Chỉ đổi trạng thái panel chưa đủ hoàn tất ticket.']}),
    },
    answerOverrides: answer('Rescue ISO đang gắn và optical đứng trước disk. REC-420 còn mở, OS disk còn gắn nhưng health pending; chưa thể kết luận disk hỏng hay khỏe.', 'Xác nhận với đội recovery/owner công việc đã xong; kiểm tra đúng OS disk, bootloader, health và backup.', 'Đội ảo hóa đổi boot hoặc tháo ISO khi được duyệt và có rollback; không tự ép reboot.', 'OS mong đợi boot lên; kiểm tra volume và các dịch vụ khách cần dùng riêng.', 'Chuyển recovery/virtualization nếu ticket còn mở, disk chưa sẵn sàng hoặc OS không boot được.', 'Không ngắt recovery đang chạy; ISO gắn không phải lý do reinstall OS disk.'),
    review: {technical:'ISO/boot order không chứng minh mất disk; giữ thông tin REC-420 và health pending.',editorial:'Phân biệt đường boot với quyền kết thúc recovery.',references:[refs.libvirt],fixtureChanges:[]},
  },
})
Object.assign(topicEdits, {
  'VPS-10-004': {
    customerExplanation: 'Khách thấy máy ảo chậm dù process trong guest khá rảnh. Cần so thời gian CPU bị host giữ lại với số liệu của node.',
    hints: ['Process idle không có nghĩa guest nhận đủ thời gian CPU.', 'Đọc tỷ lệ st trong guest rồi đối chiếu số liệu node cùng thời điểm.', 'st cao và nhiều VM cùng báo CPU ready hỗ trợ giả thuyết contention; đội hạ tầng cần kiểm tra trend và capacity.'],
    verificationPrompt: 'Ghi tỷ lệ steal trong guest, phạm vi VM bị ảnh hưởng và giới hạn của một ảnh chụp. Nêu dữ liệu cần chuyển đội hạ tầng và cách xác minh.',
    probes: {
      P1: probe('Đọc tỷ lệ CPU steal trong guest.', 'Phân biệt CPU ứng dụng dùng với thời gian guest chờ host cấp CPU.', 'Ảnh chụp top có 60% st; cần lấy nhiều mẫu và so thời điểm khách báo chậm.'),
      P2: probe('Đọc cảnh báo CPU của node trong panel.', 'Cần biết host có tải cao cùng lúc với steal của guest không.', 'Panel báo node bị bão hòa; cảnh báo chưa chỉ ra VM hoặc tác vụ nào gây tải.', 'node=node-4 metric=cpu_ready state=high window=2026-10-22T09:00:00Z/2026-10-22T09:20:00Z'),
      G1: probe('Đọc số VM có CPU ready cao trên cùng node.', 'Xác định sự cố riêng một guest hay ảnh hưởng nhiều VM.', 'Năm VM trên node-4 có CPU ready cao trong cùng khoảng; đội host cần xem nguồn contention.'),
    },
    questions: {
      triage: question('Khách báo chậm trong khi process khá rảnh. Điều nào là triệu chứng?', 'Lời khách cho biết độ trễ và ảnh chụp process; nguyên nhân ở host vẫn cần đo.', {symptom:['Guest chậm dù process không bận.','Đây là khác biệt khách quan sát cần kiểm tra.'],other:['Ứng dụng chỉ lỗi DNS.','Khách báo độ trễ toàn VM, chưa có kết quả DNS.'],cause:['Host chắc chắn đang quá tải.','Một ảnh chụp process chưa đo được host.']}),
      check: question('Lệnh nào đọc tỷ lệ CPU steal trong ảnh chụp của ticket?', 'top có cột st; dữ liệu panel dùng để đối chiếu lớp host.', {direct:['top -b -n1 | head','st là tỷ lệ CPU bị giữ lại trong ảnh chụp.'],wrong1:['ps aux --sort=-%cpu | head','ps tìm process dùng CPU, không hiện tỷ lệ steal của guest.'],wrong2:['vmstat 1 5','vmstat cũng có cột st nhưng không phải ảnh chụp top được hỏi.']}),
      output: question('Guest có 60% st, node cảnh báo CPU ready cao. Nhận định nào đúng?', 'Hai lớp số liệu cùng hướng về tranh chấp CPU trên host, chưa xác định nguồn tải hay mức kéo dài.', {supported:['Nghi contention trên node; cần đối chiếu trend.','Steal cao và cảnh báo host hỗ trợ giả thuyết này.'],over:['Một VM khác đã được xác định gây tải.','Không có số liệu từng VM để định danh nguồn.'],ignore:['Process idle chứng minh CPU host bình thường.','Steal có thể cao ngay cả khi process trong guest không bận.']}),
      evidence: question('Chọn hai quan sát về CPU trong guest và node.', 'Phân biệt dữ kiện đo được với quyết định migrate chưa được duyệt.', {p1:['top ghi 60% st.','Giá trị ở guest là bằng chứng trong ảnh chụp.'],p2:['Panel báo CPU ready cao trên node-4.','Cảnh báo host cùng khoảng cần điều tra thêm.'],over:['Có thể tự migrate VM ngay.','Không có quyền hay kế hoạch migration được ghi nhận.']}),
      decision: question('Bước tiếp theo an toàn với nghi vấn host contention là gì?', 'Support thu trend và phạm vi ảnh hưởng để đội hạ tầng quyết định capacity.', {safe:['Thu trend st và node, chuyển đội hạ tầng.','Kèm thời điểm, độ trễ và VM ảnh hưởng để điều tra đúng node.'],unsafe:['Tự kill VM khác trên node.','Tác động khách khác mà không biết nguồn tải hoặc quyền.'],close:['Đóng ticket vì process trong guest idle.','Khách vẫn chậm và steal cao chưa được xử lý.']}),
    },
    answerOverrides: answer('Ảnh chụp guest có 60% steal, panel báo CPU ready cao trên node-4 và năm VM cùng bị ảnh hưởng. Nghi tranh chấp CPU host; chưa biết nguồn tải.', 'Thu nhiều mẫu st, độ trễ ứng dụng và node metrics cùng cửa sổ; đội host xem scheduler, VM và capacity.', 'Chuyển virtualization/host team cân bằng tải hoặc điều chỉnh capacity theo quy trình được duyệt; support không tự chuyển VM.', 'Độ trễ khách giảm, st và CPU ready về mức bình thường qua nhiều mẫu; kiểm tra ứng dụng từ client.', 'Chuyển đội hạ tầng vì support không có quyền host hoặc nhiều VM cùng ảnh hưởng.', 'Không kill VM khác hoặc migrate ngoài change chỉ dựa một ảnh chụp top.'),
    review: {technical:'Steal là thời gian guest chờ CPU host; ảnh chụp và cảnh báo chỉ hỗ trợ contention, không định danh VM gây tải.',editorial:'Câu hỏi đi từ triệu chứng sang dữ kiện hai lớp và quyết định chuyển cấp.',references:[refs.libvirt,'https://man7.org/linux/man-pages/man1/top.1.html'],fixtureChanges:[{probeId:'P2',reason:'Thay cụm mô tả node saturation không phải output panel bằng bản ghi metric có node và cửa sổ đo.'}]},
  },
})
Object.assign(topicEdits, {
  'VPS-10-006': {
    customerExplanation: 'Sau khi admin restore snapshot, khách thấy dữ liệu cũ. Cần tách thời điểm tạo snapshot khỏi thời điểm hoàn tất restore và bảo toàn hiện trạng.',
    hints: ['Restore hoàn tất lúc 10:14 không có nghĩa dữ liệu mới tới 10:14.', 'So thời điểm tạo snapshot, mtime file và bản backup mới hơn.', 'Backup mới hơn chưa thử restore; cần đối chiếu giao dịch với owner trước khi ghi đè production.'],
    verificationPrompt: 'Ghi mốc snapshot, restore, mtime và backup mới hơn. Nêu điều chưa rõ về giao dịch, cách thử khôi phục riêng và kiểm tra dữ liệu với owner.',
    probes: {
      P1: probe('Đọc lịch sử restore của VM.', 'Kiểm tra thao tác restore có trùng thời điểm dữ liệu trông cũ không.', 'Restore hoàn tất lúc 10:14; dòng này chưa cho biết dữ liệu bên trong snapshot mới tới đâu.'),
      P2: probe('Đọc mtime của file dữ liệu.', 'So thời điểm file được sửa với kỳ vọng của khách.', 'File có mtime 18/10; mtime riêng không đo số bản ghi hoặc chứng minh mọi thay đổi sau đó đã mất.'),
      G1: probe('Đọc thời điểm tạo snapshot đã restore.', 'Thời điểm tạo xác định mốc dữ liệu của snapshot.', 'snap-104 tạo 18/10, restore hoàn tất 22/10; dữ liệu phát sinh sau snapshot cần kiểm tra nguồn khác.'),
      G2: probe('Tìm backup mới hơn trong inventory.', 'Có thể có nguồn phục hồi khác trước khi chấp nhận mất dữ liệu.', 'Backup 21/10 có mặt nhưng chưa được thử restore; không tự khẳng định dùng được.'),
    },
    questions: {
      triage: question('Khách thấy điều gì sau thao tác restore?', 'Dữ liệu trông cũ là triệu chứng; cần đối chiếu mốc và bản ghi cụ thể.', {symptom:['Dữ liệu có vẻ cũ sau restore.','Đó là điều khách thấy trong ứng dụng.'],other:['Snapshot không thể khởi động VM.','Khách báo nội dung cũ, không báo lỗi boot.'],cause:['Mọi giao dịch mới đã mất vĩnh viễn.','Chưa so backup hay log giao dịch.']}),
      check: question('Mục nào xác nhận VM vừa được restore?', 'Lịch sử thao tác cho biết có restore, nhưng không cho tuổi dữ liệu trong snapshot.', {direct:['PANEL: activity','Ghi thao tác restore hoàn tất lúc 10:14.'],wrong1:['PANEL: restored snapshot metadata','Cho biết snapshot được tạo khi nào; mục hỏi sự kiện restore.'],wrong2:['stat /srv/app/data.db','mtime của một file không xác nhận thao tác panel.']}),
      output: question('Snapshot tạo ngày 18/10, restore ngày 22/10. Có thể kết luận gì?', 'Thời điểm restore không cập nhật dữ liệu của snapshot; số giao dịch thiếu cần đối chiếu riêng.', {supported:['Có nguy cơ dữ liệu sau 18/10 vắng mặt.','Cần kiểm tra log, backup và bản ghi thực tế.'],over:['Mọi giao dịch sau 18/10 mất vĩnh viễn.','Chưa biết backup mới hơn hoặc log có phục hồi được không.'],ignore:['Restore 22/10 nên dữ liệu đã mới tới 22/10.','Ngày hoàn tất thao tác khác ngày tạo snapshot.']}),
      evidence: question('Chọn hai mốc đã được ghi nhận trực tiếp.', 'Mốc thao tác và mtime là dữ liệu; kết luận mất vĩnh viễn vẫn quá sớm.', {p1:['Restore hoàn tất lúc 10:14.','Panel ghi thời điểm thao tác xong.'],p2:['File data.db có mtime 18/10.','stat ghi thời điểm sửa file; chưa đo từng giao dịch.'],over:['Backup 21/10 đã phục hồi thành công.','Inventory ghi restore verification chưa chạy.']}),
      decision: question('Làm gì trước khi thử dùng backup mới hơn?', 'Giữ hiện trạng và thử khôi phục độc lập để không ghi đè chứng cứ hoặc dữ liệu mới.', {safe:['Giữ hiện trạng, thử restore riêng và so giao dịch.','Owner xác nhận điểm phục hồi và dữ liệu cần giữ.'],unsafe:['Restore đè lần nữa trên production.','Có thể mất thêm dữ liệu và làm khó điều tra.'],close:['Đóng vì VM đã boot sau restore.','Khách còn thấy dữ liệu cũ.']}),
      order: question('Sắp xếp điều tra dữ liệu cũ sau restore.', 'Tìm nguồn dữ liệu, thử phục hồi có kiểm soát rồi đối chiếu nghiệp vụ.', {evidence:['So snapshot time, mtime, backup và giao dịch.','Lập timeline trước can thiệp.'],act:['Đội backup thử restore riêng theo kế hoạch duyệt.','Không ghi đè trạng thái hiện tại.'],verify:['Owner đối chiếu bản ghi và mốc phục hồi.','Ứng dụng chạy không bảo đảm dữ liệu đúng.']}),
    },
    answerOverrides: answer('VM đã restore snap-104 tạo 18/10; file data.db có mtime cùng ngày. Dữ liệu có thể lùi về mốc snapshot, nhưng chưa biết bản ghi nào thiếu và có backup 21/10 chưa thử restore.', 'Đối chiếu snapshot ID, quyền restore, backup 21/10, log giao dịch và các bản ghi khách nêu.', 'Bảo toàn hiện trạng; đội backup thử khôi phục trên môi trường riêng rồi thống nhất RPO với owner trước mọi change production.', 'Owner đối chiếu bản ghi theo mốc, tính toàn vẹn và chức năng ứng dụng sau phục hồi được duyệt.', 'Chuyển backup/data recovery nếu có nguy cơ mất giao dịch, restore không được ủy quyền hoặc bản backup chưa kiểm chứng.', 'Không restore đè lần nữa hoặc nhập lại giao dịch thủ công khi chưa rõ khả năng trùng và mất dữ liệu.'),
    review: {technical:'Phân biệt snapshot creation, restore completion và mtime. Mtime không đo giao dịch; backup inventory chưa chứng minh restore được.',editorial:'Tránh hứa phục hồi dữ liệu, tập trung timeline và xác minh nghiệp vụ.',references:[refs.libvirt,'https://man7.org/linux/man-pages/man1/stat.1.html'],fixtureChanges:[{probeId:'P2',reason:'Thay câu có từ expected không thuộc stdout stat bằng trích đoạn mtime theo định dạng stat.'}]},
  },
})
Object.assign(topicEdits, {
  'VPS-10-007': {
    customerExplanation: 'Kết nối tới VM rớt khoảng 30 giây mỗi lần live migration. Cần ghép timeline migration với packet loss và cảnh báo mạng của host.',
    hints: ['Trùng thời gian là bằng chứng tương quan, chưa tự xác định thiết bị gây lỗi.', 'So thời điểm migration với cửa sổ loss và cặp node.', 'Cảnh báo bridge learning hỗ trợ hướng điều tra; đội network/virtualization cần xác minh trước thay đổi.'],
    verificationPrompt: 'Ghi timeline migration, loss, cặp node và cảnh báo bridge. Nêu giới hạn kết luận, đội cần chuyển cấp và phép kiểm tra trong migration thử được duyệt.',
    probes: {
      P1: probe('Đọc thời gian live migration.', 'Cần xác định cửa sổ thay đổi để so với lần kết nối rớt.', 'Task kéo dài từ 08:00:00 tới 08:00:36; không mô tả riêng đường mạng.'),
      P2: probe('Đọc packet loss từ điểm giám sát.', 'So loss với cửa sổ migration thay vì quy lỗi cho ứng dụng.', 'Monitor ghi loss từ 08:00:04 tới 08:00:35, gần trùng task; chưa biết hop hoặc cơ chế gây rớt.'),
      G1: probe('Đọc host nguồn, host đích và vNIC.', 'Đội hạ tầng cần biết đúng hai node và network để tra log.', 'Task chuyển từ node-4 sang node-7 trên public-vlan-12; đây là phạm vi điều tra, chưa xác định nguyên nhân.'),
      G2: probe('Đọc cảnh báo mạng khi migration.', 'Kiểm tra có dấu hiệu từ bridge trong cùng khoảng loss không.', 'Cảnh báo bridge learning delay 29 giây hỗ trợ giả thuyết hội tụ chậm; cần log/capture để xác nhận.'),
    },
    questions: {
      triage: question('Khách mô tả mất kết nối vào lúc nào?', 'Mốc migration giúp đặt đúng cửa sổ điều tra; chưa tự quy lỗi thiết bị.', {symptom:['Rớt kết nối khoảng 30 giây khi migration.','Đó là mẫu lặp khách báo.'],other:['Mất mạng liên tục cả ngày, không liên quan migration.','Khách nêu sự kiện migration cụ thể.'],cause:['Một switch chắc chắn làm rớt gói.','Lời khách chưa có dữ liệu từ switch.']}),
      check: question('Mục nào cho giờ bắt đầu và kết thúc migration?', 'Đọc task trước rồi so với network monitor và host logs.', {direct:['PANEL: migration task','Ghi 08:00:00 tới 08:00:36.'],wrong1:['PANEL: network monitor','Cho cửa sổ loss, không phải giờ của task.'],wrong2:['PANEL: migration hosts','Cho node nguồn/đích, không ghi khoảng thời gian task.']}),
      output: question('Loss gần trùng migration và bridge learning trễ. Nhận định nào đúng?', 'Tương quan mạnh và warning cùng lớp hướng điều tra mạng, chưa định danh switch hay quy tắc lỗi.', {supported:['Nghi đường mạng lúc migration; cần host logs.','Timeline và cảnh báo bridge hỗ trợ điều tra.'],over:['Đã xác định ARP cache của switch cụ thể sai.','Không có capture hoặc log của switch đó.'],ignore:['Guest CPU idle nên không có sự cố mạng.','CPU guest không đo đường mạng khi di chuyển.']}),
      evidence: question('Chọn hai mốc trực tiếp từ task và monitor.', 'Hai khoảng gần nhau là dữ kiện, không phải bằng chứng tự sửa bridge.', {p1:['Task 08:00:00–08:00:36.','Panel ghi cửa sổ migration.'],p2:['Loss 08:00:04–08:00:35.','Monitor ghi cửa sổ rớt gói.'],over:['Firewall guest là nguyên nhân đã xác minh.','Chưa có rule hoặc packet capture chứng minh.']}),
      decision: question('Support nên làm gì trước migration tiếp theo?', 'Thu bằng chứng ở cả node và chuyển đội có quyền; bảo vệ dịch vụ khách khi thử lại.', {safe:['Thu log hai node và chuyển network/virtualization.','Hoãn migration tiếp theo theo policy nếu còn rủi ro.'],unsafe:['Tự sửa bridge hoặc tắt firewall guest.','Thiếu quyền, có thể làm mất kết nối rộng hơn.'],close:['Đóng ticket vì VM vẫn Running.','Kết nối khách vẫn rớt mỗi lần migration.']}),
      order: question('Sắp xếp việc điều tra rớt mạng khi migration.', 'Đối chiếu timeline, chuyển xử lý có quyền rồi xác minh cùng giao thức từ client.', {evidence:['So task, loss, cặp node và bridge warning.','Ghi nguồn/timestamp trước khi suy luận.'],act:['Đội hạ tầng xử lý đường migration theo change duyệt.','Tránh tự sửa guest hoặc host thiếu căn cứ.'],verify:['Migration thử đáp ứng SLA và TCP client ổn.','VM Running chưa đủ xác nhận kết nối.']}),
    },
    answerOverrides: answer('Packet loss 08:00:04–08:00:35 gần trùng migration 08:00:00–08:00:36 và có cảnh báo bridge learning delay. Nghi đường mạng lúc di chuyển, chưa định danh thiết bị hoặc cấu hình lỗi.', 'Thu migration mode, log bridge/vNIC ở node-4/node-7, switch/ARP và capture có giới hạn cùng thời điểm.', 'Chuyển network/virtualization điều tra và tạm hoãn migration thêm theo policy; chỉ thử thay đổi trong kế hoạch duyệt.', 'Trong migration thử có giám sát, TCP từ client duy trì theo SLA, loss và cảnh báo bridge không lặp lại.', 'Chuyển hạ tầng khi cần quyền host/switch hoặc nhiều VM bị ảnh hưởng.', 'Không tự đổi bridge, tắt firewall guest hoặc ép migration để kiểm tra giả thuyết.'),
    review: {technical:'Tương quan timeline và bridge learning chưa định danh switch/ARP cause. Quyết định host/network thuộc đội hạ tầng.',editorial:'Bài L3 có bốn nguồn panel, giới hạn quyền và điều kiện thử theo SLA.',references:[refs.libvirt],fixtureChanges:[]},
  },
})
Object.assign(topicEdits, {
  'VPS-10-008': {
    customerExplanation: 'Chứng chỉ bị từ chối trong VM dù giờ host được báo là đúng. Cần kiểm tra giờ và dịch vụ đồng bộ của guest bằng một mốc thời gian tin cậy.',
    hints: ['Giờ host đúng không tự bảo đảm đồng hồ guest chính xác.', 'Đọc timedatectl và date -u của guest; xác định OS cùng dịch vụ đồng bộ đang dùng.', 'NTP inactive và synchronized: no cần so với nguồn UTC tin cậy trước khi định lượng sai lệch hoặc quy lỗi TLS.'],
    verificationPrompt: 'Ghi trạng thái đồng bộ trong guest và UTC đọc được. Nêu mốc tin cậy còn thiếu, cách kiểm tra chronyd và xác minh TLS sau xử lý được duyệt.',
    probes: {
      P1: probe('Đọc giờ và trạng thái đồng bộ trong guest.', 'Giờ host riêng không chứng minh guest đang dùng nguồn NTP hợp lệ.', 'timedatectl cho thấy synchronized: no và NTP service: inactive; cần kiểm tra cấu hình, không thể đo độ lệch chỉ từ cờ này.'),
      P2: probe('Đọc UTC hiện tại trong guest.', 'Cần mốc của guest để so với nguồn thời gian được tin cậy.', 'Guest in ngày 21/10 lúc 01:00 UTC; chưa có timestamp host cùng thời điểm nên chưa kết luận lệch một ngày.', 'Wed Oct 21 01:00:00 UTC 2026'),
      G1: probe('Xác định hệ điều hành của guest.', 'Tên dịch vụ đồng bộ phụ thuộc image và cấu hình đang chạy.', 'Guest là CentOS Stream 9; có thể dùng chronyd, nhưng cần đọc trạng thái thực.', 'ID="centos"\nVERSION_ID="9"'),
      G2: { ...probe('Đọc trạng thái chronyd trong guest.', 'Đối chiếu cờ NTP inactive với dịch vụ đồng bộ thường dùng trên CentOS Stream 9.', 'chronyd inactive trong mẫu này; chưa biết nguồn NTP có tới được hoặc TLS thất bại cụ thể vì sao.', '● chronyd.service - NTP client/server\n     Loaded: loaded (/usr/lib/systemd/system/chronyd.service; disabled)\n     Active: inactive (dead)'), command: 'systemctl status chronyd', commandId: 'systemctl-service' },
    },
    questions: {
      triage: question('Khách báo điều gì về chứng chỉ trong VM?', 'Lỗi TLS trong guest là triệu chứng; chưa có phép so đồng hồ với nguồn chuẩn.', {symptom:['TLS trong guest lỗi dù giờ host được báo đúng.','Cần kiểm tra giờ và xác thực chứng chỉ từ guest.'],other:['Guest không còn dung lượng ghi file.','Không có lỗi disk trong lời báo.'],cause:['Đã xác định guest lệch đúng một ngày.','Chưa có timestamp host tin cậy cùng thời điểm.']}),
      check: question('Lệnh nào đọc cờ đồng bộ thời gian của guest?', 'timedatectl đọc trạng thái clock và NTP, còn date -u chỉ in một mốc UTC.', {direct:['timedatectl','Hiển thị synchronized và NTP service.'],wrong1:['date -u','Cho giờ guest, không cho cờ đồng bộ.'],wrong2:['systemctl status chronyd','Đọc một dịch vụ NTP, không thay trạng thái đồng bộ tổng quát.']}),
      output: question('timedatectl ghi synchronized: no. Có thể kết luận gì?', 'Guest chưa xác nhận đồng bộ; lỗi TLS còn cần so giờ chuẩn và xem kết quả kiểm tra chứng chỉ.', {supported:['Đồng bộ chưa được xác nhận; cần mốc UTC chuẩn.','NTP inactive làm hướng kiểm tra có cơ sở.'],over:['Cờ synchronized: no cho biết guest đang lệch đúng 24 giờ.','Cờ này không cho biết số giây lệch. Phải so giờ guest với nguồn UTC tin cậy ở cùng thời điểm.'],ignore:['Giờ host đúng nên không cần đo lại giờ trong guest.','Guest có đồng hồ và dịch vụ đồng bộ riêng; giờ host không thay thế phép đo trong guest.']}),
      evidence: question('Chọn hai quan sát đã đọc trong guest.', 'Cờ đồng bộ và một mốc UTC không tự cho độ lệch với host.', {p1:['System clock synchronized: no.','timedatectl ghi trực tiếp trạng thái này.'],p2:['Guest in 21/10 01:00 UTC.','date -u ghi mốc của guest.'],over:['Host in 22/10 01:00 UTC cùng lúc.','Chưa có timestamp host được thu cùng thời điểm.']}),
      decision: question('Bước xử lý nào an toàn khi nghi lệch giờ guest?', 'Kiểm tra dịch vụ và nguồn thời gian trước change; xác minh TLS sau đồng bộ được duyệt.', {safe:['So nguồn UTC, chronyd và TLS trước change.','Owner/admin duyệt cấu hình đồng bộ, rồi thử lại chứng chỉ.'],unsafe:['Tự chỉnh date trên production rồi đóng ticket.','Có thể ảnh hưởng log, token và dịch vụ phụ thuộc thời gian.'],close:['Đóng vì đồng hồ host đúng.','Lỗi TLS của guest chưa được giải quyết.']}),
      order: question('Sắp xếp điều tra thời gian và TLS trong guest.', 'Xác nhận mức lệch, xử lý đồng bộ đúng quyền rồi thử lại TLS.', {evidence:['So UTC guest/nguồn chuẩn, chronyd và cert error.','Tránh đoán mức lệch từ cờ sync.'],act:['Admin sửa đồng bộ theo change được duyệt.','Cân nhắc dịch vụ nhạy thời gian và rollback.'],verify:['Clock đồng bộ và TLS hợp lệ từ guest.','Cần kiểm tra chain, hostname và thời hạn chứng chỉ.']}),
    },
    answerOverrides: answer('Guest ghi synchronized: no và NTP inactive; chronyd cũng inactive trong mẫu. Đây là bằng chứng đồng bộ thời gian chưa được xác nhận, nhưng thiếu timestamp chuẩn đồng thời để định lượng độ lệch hoặc quy toàn bộ lỗi TLS cho clock.', 'So UTC với nguồn tin cậy cùng lúc; đọc chronyd tracking/sources, NTP reachability và lỗi cert cụ thể trong guest.', 'Admin cấu hình đồng bộ thời gian theo policy sau khi đánh giá ứng dụng nhạy thời gian; không chỉnh giờ thủ công thiếu kế hoạch.', 'Guest synchronized theo nguồn tin cậy; thời gian đúng và kiểm tra chain, hostname, hạn cert/TLS từ guest thành công.', 'Chuyển host/time-service team nếu nguồn thời gian host/migration có vấn đề hoặc guest không tới được NTP sau kiểm tra.', 'Không suy giờ guest lệch đúng một ngày từ timestamp thiếu đối chiếu; thay đổi clock có thể ảnh hưởng token, log và ứng dụng.'),
    review: {technical:'Source ghi host is Oct 22 trong stdout date -u; bỏ chú thích giả. Guest OS source là CentOS Stream 9, thay Ubuntu/timesyncd bằng chronyd và không khẳng định độ lệch khi thiếu host timestamp đồng thời.',editorial:'Tập trung phân biệt trạng thái NTP, giờ guest và kết quả TLS thay vì kết luận sớm.',references:[refs.systemd,'https://chrony-project.org/documentation.html'],fixtureChanges:[{probeId:'P2',reason:'Loại ghi chú host is Oct 22 không phải stdout date -u; giữ mốc UTC guest.'},{probeId:'G1',reason:'Đổi Ubuntu sang CentOS Stream 9 theo guest_os gốc; giữ dạng /etc/os-release.'},{probeId:'G2',reason:'Đổi systemd-timesyncd Ubuntu sang chronyd CentOS trong lệnh và output Guided.'}]},
  },
})
