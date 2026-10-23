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
        wrong1: ['dig example.com A', 'dig hỏi bản ghi DNS; một IP đúng vẫn không trả lời nếu VM đã tắt.'],
        wrong2: ['df -h /', 'df đọc dung lượng trong guest và không cho biết trạng thái nguồn ở hypervisor.'],
      }),
      output: question('Powered Off cùng sự kiện user requested shutdown cho phép nhận định nào?', 'Hai quan sát phù hợp với một yêu cầu shutdown; chưa có bằng chứng rằng host tự tắt hoặc hỏng.', {
        supported: ['VM đang tắt; cần xác minh yêu cầu shutdown trước khi bật lại.', 'Powered Off và event shutdown khớp nhau, còn ý định bật lại cần owner xác nhận.'],
        over: ['Provider đã tự ý tắt VPS của khách.', 'Event ghi yêu cầu từ user, không phải bằng chứng provider tự tắt.'],
        ignore: ['Không phản hồi chứng minh guest đang treo dù panel báo tắt.', 'Trạng thái tắt đã giải thích việc không phản hồi; chưa có dữ liệu về guest treo.'],
      }),
      evidence: question('Chọn hai điều được trạng thái nguồn và event log ghi nhận.', 'Power state mô tả hiện tại; event log bổ sung sự kiện trước đó, chưa xác nhận ý định của owner.', {
        p1: ['Panel hiển thị Powered Off.', 'Đây là trạng thái máy ảo được panel ghi nhận.'],
        p2: ['Có yêu cầu shutdown lúc 12:30.', 'Event log có thời điểm và loại yêu cầu shutdown.'],
        over: ['Host đã gặp sự cố phần cứng.', 'Không có cảnh báo host hoặc lỗi phần cứng trong hai mục được hỏi.'],
      }),
      decision: question('Audit chỉ ra account-owner đã shutdown. Nên xử lý yêu cầu bật lại thế nào?', 'Tắt có chủ đích không phải giấy phép cho support bật lại; cần xác nhận owner và kiểm tra dịch vụ sau start.', {
        safe: ['Xác nhận owner muốn bật lại rồi chuyển yêu cầu start theo quyền.', 'Xác minh người yêu cầu tránh bật máy đang được tắt có chủ đích hoặc bảo trì.'],
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
        other: ['Backend trả502 sau khi TLS đã hợp lệ.', 'Khách báo certificate expired, không phải một HTTP502 đã được đo.'],
        cause: ['Cert đã gia hạn nên trình duyệt chắc chắn báo sai.', 'Gia hạn trong panel chưa chứng minh endpoint đã phục vụ cert mới.'],
      }),
      check: question('Làm sao đọc ngày hết hạn của cert mà example.com:443 thực sự gửi?', 'Kết nối tới 443 với đúng SNI rồi đọc cert được gửi; ngày trong inventory không thay thế kết quả từ endpoint.', {
        direct: ['echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -dates', 's_client lấy cert theo SNI; x509-dates in notBefore và notAfter.'],
        wrong1: ['df -h /', 'df đo dung lượng filesystem; không đọc cert gửi qua TLS.'],
        wrong2: ['ip route', 'Bảng route cho biết đường IP; không chứa ngày hết hạn cert.'],
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
      G1: probe('Tìm volume dữ liệu theo ID trong inventory.', 'Không được gắn một volume chỉ vì tên/path tương tự; cần đúng ID và lịch sử attachment.', 'vol-72 còn trong inventory, trạng tháiavailable; integrity vẫn pending nên chưa hứa dữ liệu nguyên vẹn.'),
      G2: probe('Đọc kết quả bước storage trong migration.', 'Liên hệ thời điểm mất volume với task chuyển node.', 'Task 08:00 ghi attach vol-72 bị skip; cần đội host xác minh và khôi phục attachment theo quyền.'),
    },
    questions: {
      triage: question('Ứng dụng mất volume sau migration: triệu chứng nào cần khoanh trước?', 'Khách báo thiếu thiết bị/dữ liệu sau chuyển node; phải xác định lớp attachment trước khi xử lý filesystem.', {
        symptom: ['Ứng dụng không thấy volume dữ liệu sau migration.', 'Đây là thay đổi quan sát được, chưa nói dữ liệu đã mất vĩnh viễn.'],
        other: ['Website chỉ dùng sai chứng chỉTLS.', 'Cảnh báo cert không giải thích volume block biến mất khỏi guest.'],
        cause: ['Dữ liệu chắc chắn đã bị xóa trong migration.', 'Không thấy thiết bị cũng có thể do attachment bị bỏ qua.'],
      }),
      check: question('Trong guest, lệnh nào cho biết hiện có những block device nào?', 'lsblk liệt kê thiết bị ởguest; attachment ởhypervisor phải đọc bằng phép kiểm tra riêng.', {
        direct: ['lsblk', 'Đọc cây thiết bị block và kích thước guest nhận được.'],
        wrong1: ['dig example.com A', 'DNS không liệt kê volume của máy ảo.'],
        wrong2: ['systemctl restart nginx', 'Restart webservice là thay đổi; không kiểm tra attachment và không làm hiện disk bị thiếu.'],
      }),
      output: question('Guest chỉ thấy vda, host không có vdb và task ghi attach skipped. Bạn xác định được gì?', 'Attachment của data volume đã bị bỏ qua theo task; inventory còn volume nhưng phải kiểm tra đúng ID/integrity trước phục hồi.', {
        supported: ['Data volume chưa gắn vào VM; cần inventory và đội storage/virtualization.', 'Guest/host cùng thiếu vdb và task bổ sung bước attach skipped.'],
        over: ['Volume đã bị xóa vĩnh viễn nên không thể phục hồi.', 'Inventory cònvol-72 available; chưa có kết luận dữ liệu bị xóa.'],
        ignore: ['Chỉ cần mount /data vì host đã gắn vdb đầy đủ.', 'domblklist chưa cóvdb; mount không tự tạo attachment còn thiếu.'],
      }),
      evidence: question('Chọn hai quan sát so sánh guest và host trong ca mấtvolume.', 'Thiếu ở cả hai lớp khác với trường hợp host có disk nhưng guest chưa nhận; chưa được suy ra dữ liệu bên trong.', {
        p1: ['lsblk trong guest chỉ liệt kê vda.', 'Không có vdb trong danh sách thiết bị được guest nhìn thấy.'],
        p2: ['domblklist của VM chỉ có attachment vda.', 'Host chưa liệt kê data disk cho VM này.'],
        over: ['Hai danh sách xác nhận data volume không còn tồn tại.', 'Danh sách thiết bị gắn vào VM không phải toàn bộ inventory storage.'],
      }),
      decision: question('Cách nào bảo vệ dữ liệu khi cần khôi phục attachmentvol-72?', 'Cần đúng volume ID, kiểm tra snapshot và quyền đội host; tránh để app ghi vào thư mục/data trên disk OS thay thế.', {
        safe: ['Hạn chế ghi nhầm /data và chuyển đội storage gắn đúng volume có kiểm soát.', 'Giữ nguyên volume, đối chiếu ID/snapshot và phối hợp đúng đội có quyền host.'],
        unsafe: ['Tạo filesystem mới tại /data để app chạy lại.', 'Có thể ghi dữ liệu lên sai disk hoặc phá dữ liệu nếu thao tác nhầmvolume.'],
        close: ['Đóng ticket ngay khi task migration báo Completed.', 'Task có warning và app còn thiếuvolume; trạng thái Completed chưa giải quyết triệu chứng.'],
      }),
      order: question('Sắp xếp quy trình phục hồi data volume bị thiếu sau migration.', 'Xác định đúng thiết bị và inventory trước; gắn lại có quyền; sau đó kiểm tra mount, dữ liệu và app.', {
        evidence: ['So guest/host, volume ID và cảnh báo task migration.', 'Danh sách attachment và inventory giúp tránh gắn nhầmvolume.'],
        act: ['Độihost khôi phục attachment đúng ID theo change được duyệt.', 'Chỉ đội có quyền mới thao tác storage; không format để thử.'],
        verify: ['Kiểm tra đúng volume, mount /data và dữ liệu ứng dụng.', 'Thiết bị hiện lại mới là bước đầu; phải kiểm chứng dữ liệu và chức năng app.'],
      }),
    },
    review: { technical: 'lsblk phải là bảng thiết bị; domblklist thiếu vdb không đồng nghĩa disk deleted; bảo vệ đúng ID và dữ liệu.', editorial: 'Câu hỏi phân biệt attachment, thiết bị và integrity, không dùng thuật ngữ nội bộ.', references: [refs.libvirt,'https://man7.org/linux/man-pages/man8/lsblk.8.html'], fixtureChanges: [{probeId:'P1',reason:'Source vda 25G only là mô tả tiếng Anh, thay bằng bảng NAME/SIZE/TYPE lsblk tối thiểu.'}] },
  },
}
