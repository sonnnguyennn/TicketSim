# Phase B — Command Library audit

122 thẻ được agent đọc theo source: công dụng, flags, OS/context, ví dụ, giới hạn kết luận và quyền. Không thực thi trên CentOS/Ubuntu thật. Ví dụ ngắn được hiển thị là trích đoạn; stdout rỗng có ghi chú ngoài output.

| ID | Trạng thái | Trường sửa | Nội dung đã đối chiếu |
|---|---|---|---|
| systemctl-status | Đã rà soát và sửa | pitfalls | Active cho biết service hiện chạy hay dừng; không tự nói nguyên nhân. CentOS Stream 9 thường dùng sshd.service; Ubuntu dùng ssh.service và có thể có ssh.socket. active không chứng minh TCP từ client hoạt động. |
| ss-ltnp | Đã rà soát, giữ nội dung |  | Không có listener ở cổng cần thiết phù hợp với connection refused. Thiếu quyền có thể không hiện tên process. |
| journalctl-unit | Đã rà soát, giữ nội dung |  | Log có thể gợi nguyên nhân dừng; không có log không chứng minh hệ thống bình thường. Cần quyền xem journal; không suy luận từ một dòng riêng lẻ. |
| df-h | Đã rà soát và sửa | exampleOutput | Use% và Available phản ánh block space. Có dung lượng trống vẫn có thể hết inode. |
| ssh-vvv | Đã rà soát, giữ nội dung |  | Các dòng debug giúp phân biệt kết nối, host key và xác thực. Output có thể lộ thông tin môi trường; không dán secret. |
| getent-passwd | Đã rà soát, giữ nội dung |  | Không có entry cho tên user yêu cầu là bằng chứng quan trọng. Không tạo hoặc reset user nếu chưa được phép. |
| ip-addr | Đã rà soát, giữ nội dung |  | IP trên interface giúp kiểm tra cấu hình guest. Có IP không chứng minh có default route. |
| ip-route | Đã rà soát, giữ nội dung |  | Thiếu dòng default có thể giải thích không đi tới mạng ngoài subnet. Cần biết gateway được cấp trước khi thay đổi route. |
| ip-route-get | Đã rà soát, giữ nội dung |  | Kết quả cho biết next hop/interface hoặc lỗi route. Một route tồn tại chưa chứng minh kết nối TCP thực sự hoạt động. |
| nmcli-show | Đã rà soát và sửa | pitfalls, exampleOutput | Tên profile và trạng thái hỗ trợ kiểm tra cấu hình mạng. Chỉ áp dụng khi NetworkManager quản lý interface. Ubuntu Server có thể dùng Netplan với systemd-networkd; không down connection để thử. |
| systemctl-nginx | Đã rà soát, giữ nội dung |  | inactive nghĩa là Nginx hiện không chạy. VPS running không đồng nghĩa web service đang chạy. |
| journalctl-nginx | Đã rà soát, giữ nội dung |  | Log giúp tìm lỗi khởi động hay cấu hình. Cần đối chiếu thời gian lỗi với ticket. |
| nginx-test | Đã rà soát, giữ nội dung |  | syntax is ok hỗ trợ bước tiếp theo nhưng không chứng minh site hoạt động. Một cấu hình hợp lệ vẫn có thể trỏ sai upstream. |
| du-var | Đã rà soát và sửa | pitfalls, safety, privilege | Chỉ ra nơi chiếm dung lượng để tiếp tục điều tra. Thư mục không đọc được có thể làm tổng thấp hơn thực tế; phép quét lớn cũng tạo I/O. Xác định retention và owner trước khi dọn dữ liệu. |
| df-i | Đã rà soát và sửa | interpretation, exampleOutput | IUse% là tỷ lệ inode đã dùng; 100% có thể gây lỗi tạo file dù df -h còn dung lượng. Phân biệt inode với block space của df -h. |
| find-files | Đã rà soát, giữ nội dung |  | Nhiều file ở một thư mục có thể làm cạn inode. Output có thể rất lớn; giới hạn và thu hẹp phạm vi khi thực hành thật. |
| curl-head | Đã rà soát, giữ nội dung |  | Status và header cho thấy web server có phản hồi tại đích kiểm tra. Localhost thành công chưa chứng minh truy cập ngoài Internet. |
| dig-a | Đã rà soát và sửa | pitfalls, exampleOutput | ANSWER SECTION và status cho biết kết quả từ resolver được hỏi. Một resolver không đại diện mọi người dùng. CentOS cần bind-utils; Ubuntu dùng dnsutils. NOERROR có thể vẫn không có record đúng loại. |
| dig-ns | Đã rà soát và sửa | interpretation | NS trong câu trả lời từ resolver cần đối chiếu delegation tại parent và authoritative; một truy vấn cache không chứng minh registrar đã cập nhật. Phân biệt authoritative nameserver với resolver cache. |
| resolvectl | Đã rà soát và sửa | interpretation, pitfalls, centos | resolvectl hỏi systemd-resolved; nmcli đọc cấu hình NetworkManager. Chúng xem hai lớp khác nhau, cần xác định máy đang dùng lớp nào. CentOS Stream 9 thường dùng NetworkManager; không mặc định có systemd-resolved. Ubuntu có thể dùng resolved nhưng phải kiểm tra cấu hình thực. |
| free-h | Đã rà soát và sửa | interpretation, exampleOutput, followUp | available ước lượng RAM có thể cấp thêm mà chưa cần swap; free thấp một mình chưa chứng minh thiếu RAM. Cách tính used khác theo phiên bản procps. Không kết luận thiếu RAM chỉ từ một ảnh chụp. cat /proc/pressure/memory là phép đọc bổ sung khi kernel bật PSI: some/full đo thời gian task bị chờ bộ nhớ; avg10/60/300 là phần trăm, total tính microsecond. PSI không chỉ ra process gây áp lực. Đối chiếu journal và nhiều mẫu; file PSI có thể không có trên cấu hình kernel hiện tại. |
| top | Đã rà soát và sửa | pitfalls, exampleOutput | So sánh tải CPU, memory và process nổi bật. Mẫu đầu và một lần chụp có thể không đại diện lúc chậm. Lấy nhiều mẫu, phân biệt us, wa, st và tải process trước kết luận. |
| firewall-list | Đã rà soát và sửa | purpose, interpretation, pitfalls, flags, ubuntu | Đọc service/port của đúng active zone. Không có service ssh trong một zone chưa đủ chứng minh mọi đường tới cổng 22 bị chặn. Ubuntu thường dùng UFW; nếu máy dùng firewalld thì dùng firewall-cmd như CentOS. UFW không có zone giống firewalld. Còn provider ACL và nftables cần đối chiếu. |
| getenforce | Đã rà soát và sửa | pitfalls | Enforcing cho biết policy đang áp dụng. Ubuntu thường dùng AppArmor, không mặc định SELinux. Chỉ dùng getenforce khi SELinux được cài; aa-status xem AppArmor và không thay thế phép đọc SELinux. Không tắt policy để sửa lâu dài. |
| docker-ps | Đã rà soát, giữ nội dung |  | STATUS hỗ trợ phân biệt container stopped/restarting. Quyền Docker tương đương quyền mạnh trên host; chỉ dùng khi được cấp. |
| panel-rebuild | Đã rà soát và sửa | flags | Lịch sử rebuild là bối cảnh, không xác thực host key hiện tại. Không phải lệnh shell; không bỏ qua host-key verification. |
| fail2ban-status | Đã rà soát và sửa | pitfalls, ubuntu | IP trong danh sách bị ban; cần xác minh đó là IP nguồn của khách. Fail2ban phải được cài và jail sshd phải tồn tại. IP trong jail cần khớp source IP, thời gian và policy trước khi yêu cầu unban. |
| fail2ban-log | Đã rà soát và sửa | exampleOutput | Sự kiện ban cần đối chiếu source IP và failed login. Ubuntu SSH unit có thể là ssh; log có thể chứa IP nhạy cảm. |
| sshd-effective | Đã rà soát và sửa | flags, exampleOutput, interpretation | port 2222 là cấu hình đọc từ file hiện tại, chưa chứng minh daemon đang chạy đã nạp file đó hoặc có listener trên 2222. Với Match theo user/host cần tham số -C; không xem một dòng là toàn bộ chính sách. |
| ip-family-addr | Đã rà soát, giữ nội dung |  | Không có inet IPv4 cần đối chiếu profile và cấp phát. Interface có thể mang tên khác; có IPv6 không chứng minh IPv4. |
| panel-ip-allocation | Đã rà soát và sửa | flags | Cấp phát panel chưa chứng minh guest đã nhận địa chỉ. Không gán một IP đoán từ subnet; panel không phải shell. |
| panel-probes | Đã rà soát và sửa | flags | Khác biệt theo nguồn chưa định vị chính xác nơi mất gói. Không suy luận BGP/ACL cụ thể chỉ từ một panel snapshot. |
| id-user | Đã rà soát, giữ nội dung |  | So user chạy app với owner/mode/ACL của đường dẫn. id không chứng minh process thực đang chạy dưới user đó. |
| systemctl-service | Đã rà soát, giữ nội dung |  | Failed/status cần đối chiếu journal và dependency. CentOS sshd, Ubuntu ssh; tên unit phải đúng image. |
| journalctl-service | Đã rà soát, giữ nội dung |  | Đối chiếu timestamp và unit; một dòng chưa đủ toàn bộ nguyên nhân. Có thể cần sudo; log có thể chứa secret. |
| systemctl-cat | Đã rà soát, giữ nội dung |  | ExecStart xác định interpreter và môi trường của app. Không in secret trong Environment= ra ticket khách. |
| cgroup-cpu-stat | Đã rà soát và sửa | exampleOutput, interpretation, pitfalls | nr_throttled và throttled_usec là bộ đếm tích lũy của cgroup đang đọc. So hai mẫu cùng cpu.max để biết có bị giới hạn trong khoảng sự cố. Đường dẫn gốc của guest chưa chắc là cgroup container. Xác định đúng cgroup/namespace; cgroup v1 có đường dẫn khác và root cgroup có thể không có trường quota. |
| docker-stats | Đã rà soát và sửa | exampleOutput, pitfalls | CPU% cần đọc cùng quota và host/cgroup metrics. Đây là trích các cột liên quan từ bảng Docker stats. CPU 100% thường tương đương một CPU logic, chưa phải toàn host. Quyền Docker rất mạnh. |
| lsof-deleted | Đã rà soát và sửa | exampleOutput, interpretation | File đã unlink nhưng FD vẫn mở có thể giữ block. SIZE/OFF không luôn bằng dung lượng vật lý do sparse/compression; đối chiếu df, PID và mount. Có thể cần sudo để thấy process khác; không kill mù. |
| ps-process | Đã rà soát và sửa | purpose, flags, followUp | Cho biết command line tại thời điểm đo; chưa xác nhận owner thay đổi. args có thể chứa secret; không dán nguyên văn nếu có. Đối chiếu Max open files với số descriptor và log của đúng PID. Số gần soft limit hỗ trợ giả thuyết cạn FD; chưa chứng minh leak. PID có thể đổi khi service restart. |
| panel-backup-status | Đã rà soát và sửa | flags | Mốc backup cần đối chiếu phạm vi và RPO; chưa chứng minh restore thành công. Không dùng backup snapshot chưa xác minh làm cam kết dữ liệu. |
| openssl-sni | Đã rà soát, giữ nội dung |  | So SAN/cert chain với hostname yêu cầu; CN riêng không đủ kết luận coverage. Lệnh ví dụ có thể cần redirect stdin và xử lý output; không bỏ qua verify. |
| nginx-dump | Đã rà soát, giữ nội dung |  | Đối chiếu server_name, listen, certificate và upstream; chưa chứng minh process đã reload bản này. Output có thể chứa đường dẫn và secret; cần quyền đọc config. |
| panel-cert-inventory | Đã rà soát và sửa | flags | Cần so với cert từ openssl s_client theo SNI. Inventory panel có thể lệch config đang chạy. |
| panel-rdns | Đã rà soát, giữ nội dung |  | PTR thường do IP owner/provider quản lý, không tự sinh từ A record. Không đổi rDNS của IP không được cấp quyền. |
| systemctl-start | Đã rà soát và sửa | exampleOutput, interpretation | Thành công thường không in stdout. Exit code 0 chưa chứng minh chức năng người dùng đã phục hồi; cần status, listener và phép thử từ client. Start có thể thất bại hoặc hồi phục một phần; terminal không thực thi lệnh này. |
| journal-vacuum | Đã rà soát và sửa | pitfalls | Số GB giải phóng phụ thuộc archived journal thật; đo lại df và journal. Chỉ vacuum journal archived theo retention và quyền đã duyệt. Không xóa toàn bộ /var/log; giữ log cần cho điều tra và đo lại dung lượng. |
| ip-route-add | Đã rà soát và sửa | exampleOutput | Bảng route đổi không chứng minh upstream hay kết nối ngoài hoạt động. Route thêm bằng ip có thể không tồn tại sau reboot; cần xử lý profile bền vững theo change plan. |
| registrar-change | Đã rà soát, giữ nội dung |  | Registrar cập nhật không xóa cache recursive đã tồn tại. Sai NS có thể gián đoạn domain; phải giữ old zone trong thời gian cache. |
| storage-escalation | Đã rà soát, giữ nội dung |  | Escalation được tiếp nhận không đồng nghĩa volume đã sửa. Không remount rw hoặc thử ghi khi chưa đánh giá integrity. |
| ssh-key-login | Đã rà soát và sửa | exampleOutput | Cảnh báo quyền key ở client; chưa kết luận service hoặc user guest sai. Không chia sẻ private key; SSH còn phụ thuộc user và authorized_keys. |
| ls-key-mode | Đã rà soát, giữ nội dung |  | -rw-r--r-- là 0644: group và others còn quyền đọc. Chỉ kiểm tra quyền; không in nội dung private key. |
| os-release | Đã rà soát và sửa | pitfalls | Đọc ID và VERSION_ID trước khi chọn cú pháp package/service. File có thể bị sửa trong image tùy biến. PANEL: OS template chỉ là metadata image dự kiến; cần đối chiếu guest để xác nhận OS đang boot. |
| hostnamectl | Đã rà soát, giữ nội dung |  | Operating System là thông tin từ guest. Hostname không chứng minh tên DNS công cộng. |
| sshd-test | Đã rà soát và sửa | exampleOutput, interpretation | Thành công thường không in stdout; cần biết exit code để xác nhận kiểm tra đã qua. Kết quả không chứng minh service đang chạy. Có thể cần sudo để đọc host keys/config. |
| ssh-host-fingerprint | Đã rà soát và sửa | exampleOutput | So sánh fingerprint với client qua kênh tin cậy. Không chấp nhận key mới chỉ vì lệnh này có output. |
| nmcli-device-status | Đã rà soát và sửa | exampleOutput, ubuntu | connected nói profile gắn với device, chưa chứng minh Internet. Ubuntu có thể dùng netplan/systemd-networkd thay NetworkManager. |
| nmcli-device-show | Đã rà soát và sửa | ubuntu | Đối chiếu địa chỉ/gateway với thông tin cấp phát. Ubuntu không phải image nào cũng dùng NetworkManager. |
| ip-link | Đã rà soát và sửa | exampleOutput, interpretation | UP ở cột trạng thái hoạt động phải đọc cùng flags; interface UP chưa chứng minh có IP, route hay kết nối tới đích. Tên interface khác nhau theo image. |
| ping | Đã rà soát, giữ nội dung |  | ICMP có phản hồi; không chứng minh TCP hay DNS. ICMP có thể bị lọc dù TCP hoạt động. |
| nc-port | Đã rà soát và sửa | pitfalls, centos, ubuntu | Chỉ chứng minh TCP handshake, chưa chứng minh đăng nhập SSH. CentOS có thể dùng nmap-ncat, Ubuntu thường dùng netcat-openbsd; output khác giữa hai bản. Dùng đúng IP/port và nguồn; TCP thành công chưa chứng minh SSH login. |
| mtr | Đã rà soát và sửa | exampleOutput, interpretation, followUp, pitfalls, ubuntu | Loss ở hop giữa có thể do ICMP rate-limit; ngay cả loss tới đích cũng cần đối chiếu TCP và cùng cửa sổ thời gian. Có thể cần gói mtr (CentOS) hoặc mtr-tiny (Ubuntu). tracepath thuộc iputils (CentOS) hoặc iputils-tracepath (Ubuntu). Kết quả phụ thuộc nguồn, giao thức và thời điểm; không quy lỗi router chỉ từ một hàng. tracepath IP là phép đọc liên quan dùng UDP để khám phá đường đi và PMTU; pmtu N là kích thước MTU đường đi quan sát được. Nó không đo cùng giao thức với HTTPS và không tự chứng minh PMTUD gây lỗi; đối chiếu packet capture và TCP. |
| tcpdump-ssh | Đã rà soát, giữ nội dung |  | SYN đến guest không đồng nghĩa service có listener. Capture có thể chứa dữ liệu nhạy cảm; giới hạn thời gian/lưu trữ. |
| firewall-state | Đã rà soát và sửa | pitfalls, ubuntu | running chưa cho biết cổng nào được phép. UFW và firewalld khác nhau. Xác định frontend đang dùng, không kết luận firewall tắt chỉ vì firewalld không chạy. |
| firewall-zones | Đã rà soát và sửa | followUp, pitfalls, ubuntu | Cần đọc rule của đúng zone. UFW không có zone như firewalld. Với firewalld, đọc rule zone gắn đúng interface/source; đừng suy từ default zone. |
| nft-rules | Đã rà soát, giữ nội dung |  | Đọc policy và thứ tự rule của chain liên quan. Output có thể dài; không xóa rule để thử. |
| systemctl-failed | Đã rà soát, giữ nội dung |  | Unit failed cần log riêng; danh sách rỗng không chứng minh mọi app khỏe. Đừng restart hàng loạt. |
| journal-boot | Đã rà soát, giữ nội dung |  | Đối chiếu thời gian và subsystem với triệu chứng. Một dòng err có thể không liên quan ticket. |
| ps-cpu | Đã rà soát và sửa | exampleOutput, interpretation, pitfalls | %CPU của ps là tỷ lệ CPU time so với thời gian process tồn tại, không phải phần trăm riêng giây vừa qua. Dùng top/pidstat lấy mẫu khi cần xu hướng. Sắp xếp theo %CPU giúp chọn process để điều tra; chưa chứng minh process gây toàn bộ độ trễ hoặc độc hại. |
| ls-permission | Đã rà soát, giữ nội dung |  | Đọc owner/group/mode rồi đối chiếu user chạy process. Quyền trên thư mục cha cũng ảnh hưởng truy cập. |
| ausearch-avc | Đã rà soát và sửa | exampleOutput, pitfalls | Denial liên quan cần khớp thời điểm và process. CentOS cần audit/auditd và quyền xem log. Ubuntu thường dùng AppArmor; ausearch chỉ có nghĩa khi máy thật sự dùng SELinux và có audit event. |
| uptime | Đã rà soát, giữ nội dung |  | Load cần so với số CPU và trạng thái IO. Load cao không tự chứng minh CPU là nguyên nhân. |
| vmstat | Đã rà soát và sửa | exampleOutput, interpretation | Đây là hai dòng trích từ chuỗi mẫu. Dòng đầu CPU/I/O là trung bình từ boot; các dòng sau mới phản ánh khoảng 1 giây. Đối chiếu si/so, wa và st. Một vài mẫu ngắn có thể bỏ lỡ peak. |
| iostat | Đã rà soát và sửa | exampleOutput, interpretation, pitfalls, ubuntu | r_await/w_await là thời gian I/O đọc/ghi trung bình, bao gồm chờ; tên cột tùy phiên bản sysstat. So với baseline và độ trễ ứng dụng. Cần gói sysstat. Báo cáo đầu là từ boot nếu không dùng -y; %util gần 100% không tự chứng minh bão hòa thiết bị chạy I/O song song. |
| df-hT | Đã rà soát, giữ nội dung |  | Use% của đúng mount mới trả lời ticket. tmpfs/overlay có thể làm bạn đọc nhầm mount. |
| journal-disk-usage | Đã rà soát, giữ nội dung |  | Con số này không bằng toàn bộ /var/log. Không vacuum journal khi chưa rõ retention và quyền. |
| lsblk | Đã rà soát và sửa | followUp | Đối chiếu device chứa filesystem, chưa thay đổi partition. Đừng suy ra dung lượng còn trống từ lsblk. findmnt /; blkid đọc chữ ký filesystem và UUID trên thiết bị. blkid có thể cần sudo để đọc trực tiếp; không có quyền có thể chỉ trả cache. Đối chiếu UUID với fstab, không tạo filesystem để thử. |
| findmnt | Đã rà soát, giữ nội dung |  | rw/ro cho biết mode mount hiện tại. ro có thể là hậu quả lỗi I/O; cần điều tra trước sửa. |
| dmesg-tail | Đã rà soát, giữ nội dung |  | Đối chiếu device và thời gian; một dòng chưa xác định phần cứng hỏng. Có thể cần sudo; tail có thể bỏ lỡ lỗi cũ; không remount rw khi chưa rõ nguyên nhân. |
| panel-zone | Đã rà soát và sửa | flags | Zone được chỉnh chưa chứng minh registrar đã ủy quyền domain tới NS đó. Không đổi delegation hoặc xóa zone trước khi chủ sở hữu xác nhận. |
| lvm-report | Đã rà soát và sửa | exampleOutput, pitfalls, safety, privilege | VFree là phần trống trong VG, chưa phải dung lượng filesystem. Tài liệu này ghép hai phép đọc lvs và vgs. Chọn đúng lệnh/tác vụ có trong bài; chưa có free extents thì không thể mở LV từ VG đó. |
| nginx-error-tail | Đã rà soát, giữ nội dung |  | Đối chiếu timestamp và upstream; lỗi này không nói Nginx dừng. Log có thể lộ URL/IP; chia sẻ có chọn lọc. |
| dig-ptr | Đã rà soát, giữ nội dung |  | PTR là reverse DNS, không thay A record. Thay IP bằng địa chỉ thật cần kiểm tra. |
| nmcli-dns | Đã rà soát và sửa | pitfalls, ubuntu | Đây là resolver cấu hình, không bảo đảm truy vấn thành công. NetworkManager và systemd-resolved là hai lớp khác nhau; Ubuntu có thể dùng Netplan/networkd. Không thay resolver trước khi đọc cấu hình máy thực. |
| virsh-list | Đã rà soát và sửa | pitfalls, context, safety | State của VM không nói service trong guest. Chỉ dùng trên libvirt host hoặc kết nối libvirt được cấp quyền; VM running không xác minh guest OS hay ứng dụng. |
| virsh-dominfo | Đã rà soát và sửa | pitfalls, context, safety | Running chỉ nói VM đang chạy. virsh cần quyền libvirt trên host. PANEL: VM state là tác vụ đọc trạng thái từ panel, không phải lệnh virsh trong guest; metadata panel có thể trễ. Cả hai đều chưa xác nhận SSH hay ứng dụng hoạt động. |
| virsh-domiflist | Đã rà soát và sửa | exampleOutput, context, safety | Đối chiếu bridge/NIC với sơ đồ mạng. Chỉ đọc host inventory; không sửa bridge. |
| sha256sum | Đã rà soát và sửa | exampleOutput | So sánh hash với giá trị từ nguồn tin cậy. Hash khớp không chứng minh backup khôi phục được. |
| tar-list | Đã rà soát và sửa | pitfalls | Kiểm tra file kỳ vọng có trong archive. GNU tar thường tự nhận dạng kiểu nén khi đọc file; stream qua stdin có thể cần flag nén rõ ràng. Liệt kê thành công vẫn cần thử restore và kiểm tra dữ liệu ứng dụng. |
| docker-logs | Đã rà soát, giữ nội dung |  | Đối chiếu log với thời điểm sự cố. Log có thể chứa secret; quyền Docker rất mạnh. |
| docker-port | Đã rà soát, giữ nội dung |  | Host port 8080 ánh xạ vào container port 80. Port publish chưa chứng minh app đang listen. |
| docker-inspect | Đã rà soát, giữ nội dung |  | State và network config giúp khoanh vùng, không chứng minh app khỏe. Output có thể chứa environment secrets; không dán nguyên vẹn. |
| systemctl-restart | Đã rà soát và sửa | exampleOutput | Exit code 0 chỉ nói lệnh được chấp nhận; cần kiểm tra lại. Có thể gián đoạn phiên/traffic; không được terminal mô phỏng thực thi. |
| nmcli-down | Đã rà soát, giữ nội dung |  | Có thể cắt đường quản trị ngay lập tức. Không thử qua phiên SSH duy nhất. |
| rm-rf | Đã rà soát và sửa | exampleOutput | Không có output không nghĩa là dữ liệu còn nguyên. Có thể mất dữ liệu vĩnh viễn; không chạy trong terminal mô phỏng. |
| virsh-destroy | Đã rà soát và sửa | context | Guest dừng đột ngột; không phải shutdown graceful. Có nguy cơ mất dữ liệu chưa ghi; terminal mô phỏng không thực thi. |
| fstab-read | Đã rà soát, giữ nội dung |  | UUID trong fstab cần đối chiếu blkid và volume inventory; không tự sửa chỉ vì boot vào emergency. Không format hay bỏ mount dữ liệu để che sự cố. |
| panel-reinstall-confirmation | Đã rà soát, giữ nội dung |  | Reinstall có nguy cơ mất dữ liệu; cần backup/restore test và chủ sở hữu phê duyệt. Không bấm reinstall trong bài mô phỏng hoặc trên VPS khách. |
| virsh-domblklist | Đã rà soát và sửa | context, safety | Thiếu vdb trong danh sách attachment không chứng minh volume bị xóa. Chỉ đội host/storage có quyền reattach; không tự format. |
| stat-file | Đã rà soát, giữ nội dung |  | mtime một file không chứng minh toàn bộ database mất dữ liệu. Không rollback thêm trước khi bảo toàn trạng thái hiện tại. |
| timedatectl | Đã rà soát, giữ nội dung |  | Host time đúng không tự đồng bộ guest; cần kiểm tra service/time source theo image. Ubuntu có thể dùng systemd-timesyncd hoặc chrony; CentOS Stream 9 thường dùng chronyd. |
| date-utc | Đã rà soát, giữ nội dung |  | So với nguồn thời gian tin cậy trước khi đổi cấu hình sync. Một snapshot giờ không chứng minh đồng bộ bền vững. |
| last-logins | Đã rà soát, giữ nội dung |  | Một snapshot last không thay auth/audit logs và có thể bị thay đổi. Không quy kết actor chỉ từ địa chỉ IP. |
| sudoers-read | Đã rà soát, giữ nội dung |  | Grant hiện có cần đối chiếu change record và account owner. Đọc có quyền; không tự xóa grant trước khi bảo toàn chứng cứ. |
| crontab-read | Đã rà soát, giữ nội dung |  | Cron có thể tái chạy process; tên file không chứng minh malicious. Cần quyền; không xóa cron trước forensic. |
| sysctl-read | Đã rà soát, giữ nội dung |  | Forwarding off có thể chặn egress container, nhưng còn NAT/firewall/policy. Không bật forwarding hoặc sửa firewall khi chưa có quyền. |
| docker-compose-ps | Đã rà soát và sửa | command, flags, exampleOutput, interpretation, centos, ubuntu | Trạng thái từng service khác nhau; api Up chưa chứng minh DB hoặc chức năng đặt hàng khỏe. Cần quyền Docker; project name/context phải đúng. |
| docker-compose-logs | Đã rà soát, giữ nội dung |  | Đọc cùng OOMKilled, limit, host memory và thời điểm. Log có thể chứa secret; không chia sẻ nguyên văn. |
| getent-hosts | Đã rà soát, giữ nội dung |  | Có kết quả ở host chưa chứng minh container resolver hoạt động. Không kết luận từ stdout rỗng nếu chưa có exit status. |
| docker-exec-read | Đã rà soát và sửa | flags | Docker embedded DNS cần upstream và Docker network hoạt động. Quyền Docker rất mạnh; terminal bài học không chạy Docker. |
| ss-connections | Đã rà soát, giữ nội dung |  | Socket cho thấy kết nối, chưa chứng minh nội dung traffic là spam. Có thể cần sudo và output chứa IP nhạy cảm. |
| panel-backup-task | Đã rà soát và sửa | flags, interpretation | Task Failed không cung cấp một restore point hoàn tất đã kiểm chứng; cần xem artifact thực tế. Completed cũng chưa chứng minh khôi phục được. Không xóa backup theo cảm tính. |
| backup-log | Đã rà soát, giữ nội dung |  | Log phải gắn với task/timestamp; lỗi ở target khác guest filesystem. Không sửa guest disk khi lỗi là backup target. |
| panel-restore-points | Đã rà soát, giữ nội dung |  | Một mốc tồn tại chưa chứng minh dữ liệu đủ hay restore thành công. Không restore đè production khi chưa chọn đúng mốc và có phép. |
| panel-provision-task | Đã rà soát và sửa | flags | Panel task completed phải đối chiếu guest và inventory. Không tự xóa VM hoặc reinstall khi chưa xác định dữ liệu. |
| panel-task-queue | Đã rà soát, giữ nội dung |  | Task chờ lock chưa thực thi; kiểm tra task giữ lock trước xử lý. Không force unlock hoặc hủy snapshot mù. |
| panel-api-audit | Đã rà soát, giữ nội dung |  | 403 có thể do scope/resource/policy; cấp tối thiểu khi owner được xác minh. Không dùng admin token thay khách. |
| nproc | Đã rà soát và sửa | purpose, interpretation, pitfalls | Giá trị có thể thấp hơn số CPU online do affinity, giới hạn hoặc môi trường process. Đối chiếu lscpu, current/max vCPU host và gói dịch vụ. Không kết luận bị cấp thiếu chỉ từ nproc. Hành vi quota/biến môi trường tùy phiên bản coreutils; không tự reboot để áp cấu hình. |
| billing-service | Đã rà soát, giữ nội dung |  | Trạng thái billing không tự chứng minh guest power/network; kiểm tra lý do và audit. Không tự unsuspend hoặc xóa VPS khi chưa có quyền. |
| billing-invoice | Đã rà soát, giữ nội dung |  | Paid/overdue là snapshot; provision, refund và service state cần kiểm tra riêng. Không charge/refund thủ công khi chưa được billing duyệt. |
| panel-lifecycle-policy | Đã rà soát, giữ nội dung |  | Policy cần owner verification và audit; không tự quyết định eligibility. Không hứa giữ dữ liệu vô hạn hoặc xóa trước hạn. |
| panel-security-case | Đã rà soát, giữ nội dung |  | Appeal received chưa phải quyết định unsuspend. Support không override abuse hold. |
