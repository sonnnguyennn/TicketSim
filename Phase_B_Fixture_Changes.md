# Phase B — Guided-only fixture corrections

Source112 và output đã lưu trong tiến độ không bị viết lại. Các mẫu bên dưới được biên soạn theo định dạng tài liệu tham khảo; không chạy trên VPS thật. Ký hiệu ␠ và ⇥ trong khối output biểu thị space và tab ở cuối dòng của dữ liệu gốc.

## VPS-01-001/P2

No listener on :22 là diễn giải, không phải stdout ss; thay bằng bảng không có listener.

Command trước: `ss -ltnp`; sau: `ss -ltnp`.

Trước:

```text
No listener on :22
```

Sau:

```text
State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
```

Tham khảo: https://www.freedesktop.org/software/systemd/man/latest/systemctl.html, https://man7.org/linux/man-pages/man8/ss.8.html

## VPS-01-001/G2

Bổ sung tiêu đề df cho mẫu cùng dung lượng, không đổi kết luận.

Command trước: `df -h /`; sau: `df -h /`.

Trước:

```text
/dev/vda1 20G 8G 12G 40% /
```

Sau:

```text
Filesystem     Size  Used Avail Use% Mounted on
/dev/vda1       20G  8.0G   12G  40% /
```

Tham khảo: https://www.freedesktop.org/software/systemd/man/latest/systemctl.html, https://man7.org/linux/man-pages/man8/ss.8.html

## VPS-01-002/P1

Tách debug và lỗi xác thực thành các dòng SSH hợp lý thay câu ghép bằng dấu chấm phẩy.

Command trước: `ssh -vvv admin@192.0.2.25`; sau: `ssh -vvv admin@192.0.2.25`.

Trước:

```text
Authentications that can continue: publickey,password; Permission denied
```

Sau:

```text
debug1: Authentications that can continue: publickey,password
admin@192.0.2.25: Permission denied (publickey,password).
```

Tham khảo: https://man7.org/linux/man-pages/man1/getent.1.html, https://man.openbsd.org/ssh.1

## VPS-01-002/P2

no entry là chú thích, không phải stdout getent; thay chuỗi rỗng.

Command trước: `getent passwd admin`; sau: `getent passwd admin`.

Trước:

```text
no entry
```

Sau:

```text

```

Tham khảo: https://man7.org/linux/man-pages/man1/getent.1.html, https://man.openbsd.org/ssh.1

## VPS-02-001/P1

Thêm header interface/scope dạng ip -4 addr.

Command trước: `ip -4 addr show dev enp0s3`; sau: `ip -4 addr show dev enp0s3`.

Trước:

```text
inet 10.10.20.25/24
```

Sau:

```text
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
    inet 10.10.20.25/24 brd 10.10.20.255 scope global enp0s3
```

Tham khảo: https://man7.org/linux/man-pages/man8/ip-route.8.html, https://man7.org/linux/man-pages/man8/ip-address.8.html

## VPS-02-001/G2

ip -br link có linkaddress và flags, bổ sung dạng đầy đủ.

Command trước: `ip -br link show dev enp0s3`; sau: `ip -br link show dev enp0s3`.

Trước:

```text
enp0s3 UP
```

Sau:

```text
enp0s3           UP             08:00:27:12:34:56 <BROADCAST,MULTICAST,UP,LOWER_UP>
```

Tham khảo: https://man7.org/linux/man-pages/man8/ip-route.8.html, https://man7.org/linux/man-pages/man8/ip-address.8.html

## VPS-03-001/P2

no :80 listener là mô tả; dùng bảng ss không có listener.

Command trước: `ss -ltnp`; sau: `ss -ltnp`.

Trước:

```text
no :80 listener
```

Sau:

```text
State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
```

Tham khảo: https://nginx.org/en/docs/switches.html, https://www.freedesktop.org/software/systemd/man/latest/systemctl.html

## VPS-05-001/P1

Thêm headerdf, giữrootfull.

Command trước: `df -h /`; sau: `df -h /`.

Trước:

```text
/dev/vda1 20G 20G 0 100% /
```

Sau:

```text
Filesystem     Size Used Avail Use% Mounted on
/dev/vda1       20G  20G     0 100% /
```

Tham khảo: https://man7.org/linux/man-pages/man1/df.1.html, https://www.freedesktop.org/software/systemd/man/latest/journalctl.html

## VPS-05-001/P2

du-xhd1 bao gồm total/var; thêm hàng còn lại để output không chỉ là mô tả.

Command trước: `du -xhd1 /var`; sau: `du -xhd1 /var`.

Trước:

```text
13G /var/log
```

Sau:

```text
13G	/var/log
1.0G	/var/lib
14G	/var
```

Tham khảo: https://man7.org/linux/man-pages/man1/df.1.html, https://www.freedesktop.org/software/systemd/man/latest/journalctl.html

## VPS-05-001/G1

Thay IUse%trơ bằng bảngdfinode42%.

Command trước: `df -i /`; sau: `df -i /`.

Trước:

```text
IUse% 42%
```

Sau:

```text
Filesystem      Inodes  IUsed  IFree IUse% Mounted on
/dev/vda1      1310720 550502 760218   42% /
```

Tham khảo: https://man7.org/linux/man-pages/man1/df.1.html, https://www.freedesktop.org/software/systemd/man/latest/journalctl.html

## VPS-05-002/P1

Thay Use45%prose bằng bảngdf-h.

Command trước: `df -h /`; sau: `df -h /`.

Trước:

```text
Use% 45%
```

Sau:

```text
Filesystem     Size Used Avail Use% Mounted on
/dev/vda1       20G 9.0G   11G  45% /
```

Tham khảo: https://man7.org/linux/man-pages/man1/df.1.html, https://www.gnu.org/software/findutils/manual/html_mono/find.html

## VPS-05-002/P2

Thay IUse100%prose bằng bảnginodeIFree 0.

Command trước: `df -i /`; sau: `df -i /`.

Trước:

```text
IUse% 100%
```

Sau:

```text
Filesystem      Inodes   IUsed IFree IUse% Mounted on
/dev/vda1      1048576 1048576     0  100% /
```

Tham khảo: https://man7.org/linux/man-pages/man1/df.1.html, https://www.gnu.org/software/findutils/manual/html_mono/find.html

## VPS-07-001/P1

Đưa trạngthái vào dòngActive đúng kiểu systemctl thayfragment thiếu nhãn.

Command trước: `systemctl status nginx`; sau: `systemctl status nginx`.

Trước:

```text
inactive (dead)
```

Sau:

```text
Active: inactive (dead)
```

Tham khảo: https://nginx.org/en/docs/, https://man7.org/linux/man-pages/man8/ss.8.html

## VPS-07-001/P2

no :80 listener là mô tả; thay bảngss vớiSSHlistener, không cóHTTP.

Command trước: `ss -ltnp`; sau: `ss -ltnp`.

Trước:

```text
no :80 listener
```

Sau:

```text
State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
LISTEN 0 128 0.0.0.0:22 0.0.0.0:* users:(("sshd",pid=730,fd=3))
```

Tham khảo: https://nginx.org/en/docs/, https://man7.org/linux/man-pages/man8/ss.8.html

## VPS-08-002/P1

Định dạng NXDOMAIN như headerdig thật.

Command trước: `dig ww.example.com A`; sau: `dig ww.example.com A`.

Trước:

```text
status: NXDOMAIN
```

Sau:

```text
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 10421
```

Tham khảo: https://bind9.readthedocs.io/en/v9.18.41/manpages.html#dig-dns-lookup-utility

## VPS-08-002/P2

dig không+short phải có A record, không chỉ bareIP.

Command trước: `dig www.example.com A`; sau: `dig www.example.com A`.

Trước:

```text
198.51.100.20
```

Sau:

```text
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 10422
;; ANSWER SECTION:
www.example.com. 300 IN A 198.51.100.20
```

Tham khảo: https://bind9.readthedocs.io/en/v9.18.41/manpages.html#dig-dns-lookup-utility

## VPS-08-002/G1

Thay mô tả status/ANSWER bằng header vàA record.

Command trước: `dig example.com A`; sau: `dig example.com A`.

Trước:

```text
status: NOERROR; ANSWER: 198.51.100.20
```

Sau:

```text
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 10423
;; ANSWER SECTION:
example.com. 300 IN A 198.51.100.20
```

Tham khảo: https://bind9.readthedocs.io/en/v9.18.41/manpages.html#dig-dns-lookup-utility

## VPS-08-002/G2

Định dạng NXDOMAIN như headerdig.

Command trước: `dig ww.example.com NS`; sau: `dig ww.example.com NS`.

Trước:

```text
status: NXDOMAIN
```

Sau:

```text
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 10424
```

Tham khảo: https://bind9.readthedocs.io/en/v9.18.41/manpages.html#dig-dns-lookup-utility

## VPS-01-003/P1

Thay dòng ghép cảnh báo bằng các dòng SSH client gồm ignored/bad permissions.

Command trước: `ssh -i ~/.ssh/lab_key lab@192.0.2.25`; sau: `ssh -i ~/.ssh/lab_key lab@192.0.2.25`.

Trước:

```text
WARNING: UNPROTECTED PRIVATE KEY FILE! permissions 0644
```

Sau:

```text
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0644 for '/home/lab/.ssh/lab_key' are too open.
This private key will be ignored.
Load key "/home/lab/.ssh/lab_key": bad permissions
lab@192.0.2.25: Permission denied (publickey).
```

Tham khảo: https://man.openbsd.org/ssh.1, https://man7.org/linux/man-pages/man1/ls.1.html

## VPS-01-003/P2

Bổ sung trường ls -l thật, giữ mode/owner của key.

Command trước: `ls -l ~/.ssh/lab_key`; sau: `ls -l ~/.ssh/lab_key`.

Trước:

```text
-rw-r--r-- lab lab
```

Sau:

```text
-rw-r--r-- 1 lab lab 2602 Oct 22 10:00 /home/lab/.ssh/lab_key
```

Tham khảo: https://man.openbsd.org/ssh.1, https://man7.org/linux/man-pages/man1/ls.1.html

## VPS-03-003/P2

Thêm prefix nginx [emerg] và dòng test failed đúng dạng stderr kiểm tra cấu hình.

Command trước: `nginx -t`; sau: `nginx -t`.

Trước:

```text
unexpected "}" in /etc/nginx/nginx.conf:45
```

Sau:

```text
nginx: [emerg] unexpected "}" in /etc/nginx/nginx.conf:45
nginx: configuration file /etc/nginx/nginx.conf test failed
```

Tham khảo: https://nginx.org/en/docs/switches.html

## VPS-05-004/P2

Thêm dạng dmesg kernel timestamp/block/read operation thay dòng mô tả I/O đơn.

Command trước: `dmesg | tail`; sau: `dmesg | tail`.

Trước:

```text
Buffer I/O error on dev vdb
```

Sau:

```text
[8921.410235] Buffer I/O error on dev vdb, logical block 49152, async page read
```

Tham khảo: https://man7.org/linux/man-pages/man8/findmnt.8.html, https://man7.org/linux/man-pages/man8/e2fsck.8.html

## VPS-08-003/P1

Dòng NS phân cách dấu chấm phẩy là mô tả, không phải dạng dig; thay bằng header và NS record có owner/type.

Command trước: `dig example.test NS`; sau: `dig example.test NS`.

Trước:

```text
ns1.old-dns.example; ns2.old-dns.example
```

Sau:

```text
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 40318
;; ANSWER SECTION:
example.test. 300 IN NS ns1.old-dns.example.
example.test. 300 IN NS ns2.old-dns.example.
```

Tham khảo: https://bind9.readthedocs.io/en/v9.18.41/manpages.html#dig-dns-lookup-utility

## VPS-01-004/P2

Dấu chấm phẩy trong source là mô tả; thay khung firewalld zone và các mục service/ports không đổi.

Command trước: `firewall-cmd --list-all`; sau: `firewall-cmd --list-all`.

Trước:

```text
services: cockpit dhcpv6-client; ports:
```

Sau:

```text
public
  target: default
  icmp-block-inversion: no
  interfaces:
  sources:
  services: cockpit dhcpv6-client
  ports:
  protocols:
  forward: no
  masquerade: no
  forward-ports:
  source-ports:
  icmp-blocks:
  rich rules:
```

Tham khảo: https://firewalld.org/documentation/man-pages/firewall-cmd.html, https://www.freedesktop.org/software/systemd/man/latest/systemctl.html

## VPS-01-006/P2

Thêm timestamp/process và jail vào journal Ban thay dòng mô tả trơ.

Command trước: `journalctl -u fail2ban -n 20`; sau: `journalctl -u fail2ban -n 20`.

Trước:

```text
Ban 198.51.100.14
```

Sau:

```text
Oct 22 10:03:11 vps fail2ban-server[731]: [sshd] Ban 198.51.100.14
```

Tham khảo: https://github.com/fail2ban/fail2ban/wiki/Commands, https://man.openbsd.org/sshd.8

## VPS-01-007/P1

Bổ sung header/peer endpoint của ss, giữ listener2222.

Command trước: `ss -ltnp`; sau: `ss -ltnp`.

Trước:

```text
LISTEN 0 128 0.0.0.0:2222
```

Sau:

```text
State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
LISTEN 0      128          0.0.0.0:2222      0.0.0.0:*
```

Tham khảo: https://man.openbsd.org/sshd.8, https://man7.org/linux/man-pages/man8/ss.8.html, https://firewalld.org/documentation/man-pages/firewall-cmd.html

## VPS-01-007/G1

grep port còn nhận gatewayports; bổ sung dòng thực và giải thích giới hạn -T.

Command trước: `sshd -T | grep port`; sau: `sshd -T | grep port`.

Trước:

```text
port 2222
```

Sau:

```text
port 2222
gatewayports no
```

Tham khảo: https://man.openbsd.org/sshd.8, https://man7.org/linux/man-pages/man8/ss.8.html, https://firewalld.org/documentation/man-pages/firewall-cmd.html

## VPS-02-002/P1

2 received được thay bằng thống kê ping có transmitted/received.

Command trước: `ping -c 2 1.1.1.1`; sau: `ping -c 2 1.1.1.1`.

Trước:

```text
2 received
```

Sau:

```text
--- 1.1.1.1 ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1001ms
rtt min/avg/max/mdev = 12.000/12.500/13.000/0.500 ms
```

Tham khảo: https://man7.org/linux/man-pages/man8/ping.8.html, https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility

## VPS-02-002/P2

Chuẩn hóa timeout thành dòng dig communications error với resolver mẫu.

Command trước: `dig example.com A`; sau: `dig example.com A`.

Trước:

```text
connection timed out; no servers could be reached
```

Sau:

```text
;; communications error to 192.0.2.53#53: timed out
;; no servers could be reached
```

Tham khảo: https://man7.org/linux/man-pages/man8/ping.8.html, https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility

## VPS-02-003/P1

Bỏ dấu chấm phẩy giữa các interface, dùng từng dòng brief.

Command trước: `ip -br addr`; sau: `ip -br addr`.

Trước:

```text
lo UNKNOWN 127.0.0.1/8; enp0s3 UP
```

Sau:

```text
lo               UNKNOWN        127.0.0.1/8 ::1/128
enp0s3           UP
```

Tham khảo: https://man7.org/linux/man-pages/man8/ip-address.8.html, https://networkmanager.dev/docs/api/latest/nmcli.html

## VPS-02-003/P2

Thêm header nmcli device status, giữ disconnected.

Command trước: `nmcli device status`; sau: `nmcli device status`.

Trước:

```text
enp0s3 ethernet disconnected --
```

Sau:

```text
DEVICE  TYPE      STATE         CONNECTION
enp0s3  ethernet  disconnected  --
```

Tham khảo: https://man7.org/linux/man-pages/man8/ip-address.8.html, https://networkmanager.dev/docs/api/latest/nmcli.html

## VPS-02-004/P1

Hoàn thiện cột ss listener/peer, giữ bind443.

Command trước: `ss -ltnp`; sau: `ss -ltnp`.

Trước:

```text
LISTEN 0 511 0.0.0.0:443
```

Sau:

```text
State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
LISTEN 0      511          0.0.0.0:443       0.0.0.0:*
```

Tham khảo: https://firewalld.org/documentation/man-pages/firewall-cmd.html, https://man7.org/linux/man-pages/man8/ss.8.html

## VPS-02-004/P2

Thay services:semicolon bằng khung output zone firewalld.

Command trước: `firewall-cmd --list-all`; sau: `firewall-cmd --list-all`.

Trước:

```text
services: ssh; ports:
```

Sau:

```text
public
  target: default
  icmp-block-inversion: no
  interfaces:
  sources:
  services: ssh
  ports:
  protocols:
  forward: no
  masquerade: no
  forward-ports:
  source-ports:
  icmp-blocks:
  rich rules:
```

Tham khảo: https://firewalld.org/documentation/man-pages/firewall-cmd.html, https://man7.org/linux/man-pages/man8/ss.8.html

## VPS-02-005/P1

Bổ sung dạng ip -6 addr với interface và scope.

Command trước: `ip -6 addr show dev enp0s3`; sau: `ip -6 addr show dev enp0s3`.

Trước:

```text
inet6 2001:db8:100::25/64
```

Sau:

```text
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
    inet6 2001:db8:100::25/64 scope global
       valid_lft forever preferred_lft forever
```

Tham khảo: https://man7.org/linux/man-pages/man8/ip-address.8.html, https://networkmanager.dev/docs/api/latest/nmcli.html

## VPS-02-005/P2

no inet lines là mô tả; thay header interface không có inet.

Command trước: `ip -4 addr show dev enp0s3`; sau: `ip -4 addr show dev enp0s3`.

Trước:

```text
no inet lines
```

Sau:

```text
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
```

Tham khảo: https://man7.org/linux/man-pages/man8/ip-address.8.html, https://networkmanager.dev/docs/api/latest/nmcli.html

## VPS-02-007/P2

grep port còn khớp gatewayports, bổ sung dòng tương ứng.

Command trước: `sshd -T | grep port`; sau: `sshd -T | grep port`.

Trước:

```text
port 22
```

Sau:

```text
port 22
gatewayports no
```

Tham khảo: https://man.openbsd.org/sshd.8, https://man7.org/linux/man-pages/man8/ss.8.html

## VPS-02-007/G1

Chuẩn hóa header/peer của ss listener, giữport/pid.

Command trước: `ss -ltnp`; sau: `ss -ltnp`.

Trước:

```text
LISTEN 0 128 0.0.0.0:22 users:(("sshd",pid=881,fd=3))
```

Sau:

```text
State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
LISTEN 0      128          0.0.0.0:22        0.0.0.0:* users:(("sshd",pid=881,fd=3))
```

Tham khảo: https://man.openbsd.org/sshd.8, https://man7.org/linux/man-pages/man8/ss.8.html

## VPS-03-002/P1

ls -ld có linkcount/size/time/path; bổ sung metadata không đổi modeowner.

Command trước: `ls -ld /srv/app/uploads`; sau: `ls -ld /srv/app/uploads`.

Trước:

```text
drwxr-xr-x root root
```

Sau:

```text
drwxr-xr-x 2 root root 4096 Oct 22 09:00 /srv/app/uploads
```

Tham khảo: https://man7.org/linux/man-pages/man7/path_resolution.7.html, https://www.gnu.org/software/coreutils/manual/html_node/What-information-is-listed.html

## VPS-03-002/P2

Bổ sung trường groups của id, giữUIDGID.

Command trước: `id webapp`; sau: `id webapp`.

Trước:

```text
uid=1001(webapp) gid=1001(webapp)
```

Sau:

```text
uid=1001(webapp) gid=1001(webapp) groups=1001(webapp)
```

Tham khảo: https://man7.org/linux/man-pages/man7/path_resolution.7.html, https://www.gnu.org/software/coreutils/manual/html_node/What-information-is-listed.html

## VPS-03-004/P2

Thay cụm AVC thiếu metadata bằng dòng audit có context/class/permissive để nhận biết đúng bằng chứng.

Command trước: `ausearch -m AVC -ts recent`; sau: `ausearch -m AVC -ts recent`.

Trước:

```text
avc: denied { write } for comm="httpd" name="uploads"
```

Sau:

```text
type=AVC msg=audit(1792663200.123:411): avc:  denied  { write } for  pid=1412 comm="httpd" name="uploads" scontext=system_u:system_r:httpd_t:s0 tcontext=unconfined_u:object_r:default_t:s0 tclass=dir permissive=0
```

Tham khảo: https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/using_selinux/index

## VPS-03-005/P1

Đưa Dependency failed vào status/journal có unit, không giả làm Active field.

Command trước: `systemctl status myapp`; sau: `systemctl status myapp`.

Trước:

```text
Dependency failed for myapp.service
```

Sau:

```text
○ myapp.service - myapp.service
     Loaded: loaded (/etc/systemd/system/myapp.service; enabled)
     Active: inactive (dead)
Oct 22 08:00:04 vps systemd[1]: Dependency failed for myapp.service.
```

Tham khảo: https://www.freedesktop.org/software/systemd/man/latest/systemd.unit.html, https://mariadb.com/kb/en/what-to-do-if-mariadb-doesnt-start/

## VPS-03-005/G1

Thay lời mô tả failed due to missing directory bằng dạng lỗi MariaDB Errcode2 thực.

Command trước: `journalctl -u mariadb -b -n 80 --no-pager`; sau: `journalctl -u mariadb -b -n 80 --no-pager`.

Trước:

```text
mariadb.service: Failed to start due to missing /var/lib/mysql directory
```

Sau:

```text
Oct 22 08:00:03 vps mariadbd[701]: Can't change dir to '/var/lib/mysql/' (Errcode: 2 "No such file or directory")
```

Tham khảo: https://www.freedesktop.org/software/systemd/man/latest/systemd.unit.html, https://mariadb.com/kb/en/what-to-do-if-mariadb-doesnt-start/

## VPS-03-006/P1

Chuẩn hóa Active line của status auto-restart.

Command trước: `systemctl status custom-app`; sau: `systemctl status custom-app`.

Trước:

```text
activating (auto-restart), Result: exit-code
```

Sau:

```text
Active: activating (auto-restart) (Result: exit-code)
```

Tham khảo: https://docs.python.org/3/library/venv.html, https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html

## VPS-03-006/P2

Thêm dấu nháy module đúng dạng Python exception.

Command trước: `journalctl -u custom-app -n 30`; sau: `journalctl -u custom-app -n 30`.

Trước:

```text
ModuleNotFoundError: No module named requests
```

Sau:

```text
ModuleNotFoundError: No module named 'requests'
```

Tham khảo: https://docs.python.org/3/library/venv.html, https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html

## VPS-03-006/G1

Đưa ExecStart vào unit file hợp lệ gồm section và Restart=on-failure.

Command trước: `systemctl cat custom-app`; sau: `systemctl cat custom-app`.

Trước:

```text
ExecStart=/opt/custom/venv/bin/python /opt/custom/app.py
```

Sau:

```text
# /etc/systemd/system/custom-app.service
[Unit]
Description=Custom application
[Service]
ExecStart=/opt/custom/venv/bin/python /opt/custom/app.py
Restart=on-failure
```

Tham khảo: https://docs.python.org/3/library/venv.html, https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html

## VPS-04-001/P1

Thay hai trường CPUtrơ bằng 8dòngtop đúng phần head, giữus98.5.

Command trước: `top -b -n1 | head -n 8`; sau: `top -b -n1 | head -n 8`.

Trước:

```text
%Cpu(s): 98.5 us, 1.0 sy
```

Sau:

```text
top - 08:00:00 up 1 day,  2:00,  1 user,  load average: 1.20, 0.80, 0.50
Tasks: 96 total, 1 running, 95 sleeping, 0 stopped, 0 zombie
%Cpu(s): 98.5 us, 1.0 sy, 0.0 ni, 0.5 id, 0.0 wa, 0.0 hi, 0.0 si, 0.0 st
MiB Mem : 2048.0 total, 800.0 free, 900.0 used, 348.0 buff/cache
MiB Swap: 0.0 total, 0.0 free, 0.0 used. 1000.0 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 2601 app       20   0  210000  80000  10000 R  97.4   3.8  20:00.00 python3
```

Tham khảo: https://man7.org/linux/man-pages/man1/top.1.html, https://man7.org/linux/man-pages/man1/ps.1.html

## VPS-04-001/P2

Bổ sung headerps, giữPIDpython397.4.

Command trước: `ps -eo pid,comm,%cpu --sort=-%cpu | head`; sau: `ps -eo pid,comm,%cpu --sort=-%cpu | head`.

Trước:

```text
2601 python3 97.4
```

Sau:

```text
  PID COMMAND         %CPU
 2601 python3         97.4
    1 systemd          0.1
```

Tham khảo: https://man7.org/linux/man-pages/man1/top.1.html, https://man7.org/linux/man-pages/man1/ps.1.html

## VPS-04-002/P1

Đổi Memprose thành bảng free-h.

Command trước: `free -h`; sau: `free -h`.

Trước:

```text
Mem 1.0Gi total 40Mi available; Swap 512Mi 490Mi used
```

Sau:

```text
               total        used        free      shared  buff/cache   available
Mem:           1.0Gi       944Mi        20Mi         2Mi        60Mi        40Mi
Swap:          512Mi       490Mi        22Mi
```

Tham khảo: https://man7.org/linux/man-pages/man1/free.1.html, https://man7.org/linux/man-pages/man8/vmstat.8.html

## VPS-04-002/P2

vmstat1 3 phải cóheader+3dòng, thay prose si/so bằng báo cáo.

Command trước: `vmstat 1 3`; sau: `vmstat 1 3`.

Trước:

```text
si 280 so 310
```

Sau:

```text
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd  free buff cache  si  so bi bo in cs us sy id wa st
 1  1 501760 20480 1024 60416   4   5  4  5 50 80 10 5 70 15 0
 1  2 501760 20480 1024 60416 280 310 40 50 80 90 10 5 40 45 0
 1  2 501760 20480 1024 60416 280 310 40 50 80 90 10 5 40 45 0
```

Tham khảo: https://man7.org/linux/man-pages/man1/free.1.html, https://man7.org/linux/man-pages/man8/vmstat.8.html

## VPS-04-003/G1

Chuẩn hóa free-h từ Memprose, giữavailable80Mi/swap 920Mi.

Command trước: `free -h`; sau: `free -h`.

Trước:

```text
Mem: 2.0Gi total 80Mi available; Swap: 1.0Gi total 920Mi used
```

Sau:

```text
               total        used        free      shared  buff/cache   available
Mem:           2.0Gi       1.8Gi        40Mi         4Mi       160Mi        80Mi
Swap:          1.0Gi       920Mi       104Mi
```

Tham khảo: https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html, https://man7.org/linux/man-pages/man1/free.1.html

## VPS-04-004/P1

Thay prose us/wa bằng ba dòngvmstat đúng commandcount.

Command trước: `vmstat 1 3`; sau: `vmstat 1 3`.

Trước:

```text
us 5 sy 4 id 15 wa 76
```

Sau:

```text
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b swpd free buff cache si so bi bo in cs us sy id wa st
 1  2 0 512000 20000 300000 0 0 50 50 100 200 5 4 71 20 0
 1  8 0 512000 20000 300000 0 0 2000 5000 200 300 5 4 15 76 0
 1  8 0 512000 20000 300000 0 0 2000 5000 200 300 5 4 15 76 0
```

Tham khảo: https://man7.org/linux/man-pages/man8/iostat.8.html, https://man7.org/linux/man-pages/man8/vmstat.8.html

## VPS-04-004/P2

Thay vda%util/await prose bằng hai báo cáo iostat hiện đại có r_await/w_await, không dùng cột aggregateawait cũ.

Command trước: `iostat -xz 1 2`; sau: `iostat -xz 1 2`.

Trước:

```text
vda %util 99.0 await 180.0
```

Sau:

```text
avg-cpu:  %user %nice %system %iowait %steal %idle
           5.00  0.00    4.00   20.00   0.00 71.00
Device r/s rkB/s rrqm/s %rrqm r_await rareq-sz w/s wkB/s wrqm/s %wrqm w_await wareq-sz d/s dkB/s drqm/s %drqm d_await dareq-sz f/s f_await aqu-sz %util
vda 20.00 2560.00 0.00 0.00 20.00 128.00 10.00 1280.00 0.00 0.00 20.00 128.00 0.00 0.00 0.00 0.00 0.00 0.00 1.00 20.00 0.62 45.00

avg-cpu:  %user %nice %system %iowait %steal %idle
           5.00  0.00    4.00   76.00   0.00 15.00
Device r/s rkB/s rrqm/s %rrqm r_await rareq-sz w/s wkB/s wrqm/s %wrqm w_await wareq-sz d/s dkB/s drqm/s %drqm d_await dareq-sz f/s f_await aqu-sz %util
vda 80.00 10240.00 0.00 0.00 180.00 128.00 20.00 2560.00 0.00 0.00 180.00 128.00 0.00 0.00 0.00 0.00 0.00 0.00 5.00 180.00 18.90 99.00
```

Tham khảo: https://man7.org/linux/man-pages/man8/iostat.8.html, https://man7.org/linux/man-pages/man8/vmstat.8.html

## VPS-04-005/P1

Commandgốc không chỉ container; đổi docker exec api cat cùng file và giữ sourceimmutable. Output dùng từng dòngcgroupv2.

Command trước: `cat /sys/fs/cgroup/cpu.stat`; sau: `docker exec api cat /sys/fs/cgroup/cpu.stat`.

Trước:

```text
nr_periods 1400; nr_throttled 760
```

Sau:

```text
usage_usec 139800000
user_usec 130000000
system_usec 9800000
nr_periods 1400
nr_throttled 760
throttled_usec 45000000
```

Tham khảo: https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html, https://docs.docker.com/engine/containers/resource_constraints/, https://docs.docker.com/reference/cli/docker/container/stats/

## VPS-04-005/P2

Thay apiCPUprose bằng bảng dockerstats chuẩn.

Command trước: `docker stats --no-stream`; sau: `docker stats --no-stream`.

Trước:

```text
api CPU 99.8%
```

Sau:

```text
CONTAINER ID   NAME   CPU %   MEM USAGE / LIMIT   MEM %   NET I/O       BLOCK I/O   PIDS
abc123def456   api    99.8%   220MiB / 512MiB     42.97%  12MB / 10MB   0B / 0B     8
```

Tham khảo: https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html, https://docs.docker.com/engine/containers/resource_constraints/, https://docs.docker.com/reference/cli/docker/container/stats/

## VPS-05-003/P1

Hoàn thiện dòngdisk usage journal chuẩn.

Command trước: `journalctl --disk-usage`; sau: `journalctl --disk-usage`.

Trước:

```text
Archived and active journals take up 8.0G
```

Sau:

```text
Archived and active journals take up 8.0G in the file system.
```

Tham khảo: https://www.freedesktop.org/software/systemd/man/latest/journalctl.html

## VPS-05-003/P2

Thay Use94% bằng bảngdf đúng dạng.

Command trước: `df -h /`; sau: `df -h /`.

Trước:

```text
Use% 94%
```

Sau:

```text
Filesystem     Size Used Avail Use% Mounted on
/dev/vda1       20G  19G  1.2G  94% /
```

Tham khảo: https://www.freedesktop.org/software/systemd/man/latest/journalctl.html

## VPS-05-005/P1

Thay semicolonprose bằng bảnglsblkdefault có MAJ:MIN/RM/RO.

Command trước: `lsblk`; sau: `lsblk`.

Trước:

```text
vda 40G; vda1 20G
```

Sau:

```text
NAME   MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
vda    252:0    0  40G  0 disk
└─vda1 252:1    0  20G  0 part /
```

Tham khảo: https://man7.org/linux/man-pages/man8/lsblk.8.html, https://man7.org/linux/man-pages/man8/xfs_growfs.8.html

## VPS-05-005/P2

Thêm headerdf/use/mount hợp lệ, giữ20G.

Command trước: `df -h /`; sau: `df -h /`.

Trước:

```text
/dev/vda1 20G 12G 8G
```

Sau:

```text
Filesystem     Size Used Avail Use% Mounted on
/dev/vda1       20G  12G  8.0G  60% /
```

Tham khảo: https://man7.org/linux/man-pages/man8/lsblk.8.html, https://man7.org/linux/man-pages/man8/xfs_growfs.8.html

## VPS-05-006/P1

Thay Use95%prose bằng dfheader.

Command trước: `df -h /`; sau: `df -h /`.

Trước:

```text
Use% 95%
```

Sau:

```text
Filesystem     Size Used Avail Use% Mounted on
/dev/vda1       20G  19G  1.0G  95% /
```

Tham khảo: https://lsof.readthedocs.io/en/stable/manpage/, https://man7.org/linux/man-pages/man2/unlink.2.html

## VPS-05-006/P2

Thay java deleted5G prose bằng bảnglsof cóFD/nlink/sizebytes.

Command trước: `lsof +L1`; sau: `lsof +L1`.

Trước:

```text
java 2300 /var/log/app.log (deleted) 5G
```

Sau:

```text
COMMAND  PID USER   FD   TYPE DEVICE   SIZE/OFF NLINK NODE NAME
java    2300 app    12w   REG  252,1 5368709120     0  511 /var/log/app.log (deleted)
```

Tham khảo: https://lsof.readthedocs.io/en/stable/manpage/, https://man7.org/linux/man-pages/man2/unlink.2.html

## VPS-05-007/P2

Thay mô tả unit failed bằng bảng systemctl --failed, giữ unit và trạng thái.

Command trước: `systemctl --failed`; sau: `systemctl --failed`.

Trước:

```text
systemd-fsck@dev-vda1.service failed
```

Sau:

```text
  UNIT                              LOAD   ACTIVE SUB    DESCRIPTION
● systemd-fsck@dev-vda1.service      loaded failed failed File System Check on /dev/vda1

1 loaded units listed.
```

Tham khảo: https://www.freedesktop.org/software/systemd/man/latest/systemd-fsck@.service.html, https://man7.org/linux/man-pages/man8/e2fsck.8.html

## VPS-08-004/P2

Giữ nguyên timeout nhưngthêm prefix;; đúngkiểu dig.

Command trước: `dig example.com A`; sau: `dig example.com A`.

Trước:

```text
connection timed out; no servers could be reached
```

Sau:

```text
;; connection timed out; no servers could be reached
```

Tham khảo: https://bind9.readthedocs.io/en/v9.18.41/manpages.html#dig-dns-lookup-utility

## VPS-08-005/P1

dig không+short: dùng A record thaybareIP.

Command trước: `dig @authoritative.example shop.example.com A`; sau: `dig @authoritative.example shop.example.com A`.

Trước:

```text
198.51.100.20
```

Sau:

```text
shop.example.com. 300 IN A 198.51.100.20
```

Tham khảo: https://bind9.readthedocs.io/en/v9.18.41/manpages.html#dig-dns-lookup-utility

## VPS-08-005/P2

Thay IP TTL120 dạngmô tả bằng A record cóTTL đúngcột.

Command trước: `dig @1.1.1.1 shop.example.com A`; sau: `dig @1.1.1.1 shop.example.com A`.

Trước:

```text
203.0.113.10 TTL 120
```

Sau:

```text
shop.example.com. 120 IN A 203.0.113.10
```

Tham khảo: https://bind9.readthedocs.io/en/v9.18.41/manpages.html#dig-dns-lookup-utility

## VPS-08-007/P1

NXDOMAINdạngheaderdigthaymôtảstatus.

Command trước: `dig -x 198.51.100.20`; sau: `dig -x 198.51.100.20`.

Trước:

```text
status: NXDOMAIN
```

Sau:

```text
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 51231
```

Tham khảo: https://bind9.readthedocs.io/en/v9.18.41/manpages.html#dig-dns-lookup-utility

## VPS-01-008/P2

Thay dòng mô tả Mem/swap bằng bảng free -h, giữ available64Mi và swap 0.

Command trước: `free -h`; sau: `free -h`.

Trước:

```text
Mem: 1.0Gi total, 64Mi available; Swap: 0B
```

Sau:

```text
               total        used        free      shared  buff/cache   available
Mem:           1.0Gi       900Mi        24Mi         2Mi       100Mi        64Mi
Swap:             0B          0B          0B
```

Tham khảo: https://www.kernel.org/doc/html/latest/accounting/psi.html, https://man7.org/linux/man-pages/man1/free.1.html

## VPS-01-008/G1

Khóa ngày và timezone UTC của SSH journal theo incident 22/10/2026; không dùng yesterday biến đổi theo ngày chạy.

Command trước: `journalctl -u sshd --since "yesterday 23:00" --no-pager`; sau: `journalctl -u sshd --since "2026-10-22 23:00:00 UTC" --until "2026-10-22 23:30:00 UTC" --utc --no-pager`.

Trước:

```text
Oct 22 23:12:04 vps sshd[842]: pam_unix(sshd:session): session closed for user ops
```

Sau:

```text
Oct 22 23:12:04 vps sshd[842]: pam_unix(sshd:session): session closed for user ops
```

Tham khảo: https://www.kernel.org/doc/html/latest/accounting/psi.html, https://man7.org/linux/man-pages/man1/free.1.html

## VPS-02-006/P1

Thay dòng mô tả Destination bằng bảng báo cáo MTR có Snt/Loss%.

Command trước: `mtr -rw -c 20 203.0.113.20`; sau: `mtr -rw -c 20 203.0.113.20`.

Trước:

```text
Destination 203.0.113.20 Loss% 25.0 Avg 190ms
```

Sau:

```text
HOST: client                         Loss%   Snt   Last   Avg  Best  Wrst StDev
  1.|-- 192.0.2.1                      0.0%    20    2.1   2.0   1.2   3.4   0.4
  2.|-- 203.0.113.20                  25.0%    20  191.0 190.0 182.0 205.0   6.1
```

Tham khảo: https://github.com/traviscross/mtr/blob/master/man/mtr.8.in, https://man7.org/linux/man-pages/man8/ping.8.html

## VPS-02-006/P2

Thay câu 5 packets lost bằng thống kê ping transmitted/received chuẩn; tỷ lệ không đổi.

Command trước: `ping -c 20 203.0.113.20`; sau: `ping -c 20 203.0.113.20`.

Trước:

```text
5 packets lost, 25% packet loss
```

Sau:

```text
--- 203.0.113.20 ping statistics ---
20 packets transmitted, 15 received, 25% packet loss, time 19025ms
rtt min/avg/max/mdev = 182.000/190.000/205.000/6.100 ms
```

Tham khảo: https://github.com/traviscross/mtr/blob/master/man/mtr.8.in, https://man7.org/linux/man-pages/man8/ping.8.html

## VPS-02-008/P1

Thay dòng Frag needed đơn bằng outputping nêu payload/gói/ICMPMTU.

Command trước: `ping -M do -s 1472 198.51.100.20`; sau: `ping -M do -s 1472 198.51.100.20`.

Trước:

```text
Frag needed and DF set
```

Sau:

```text
PING 198.51.100.20 (198.51.100.20) 1472(1500) bytes of data.
From 10.8.0.1 icmp_seq=1 Frag needed and DF set (mtu = 1400)
```

Tham khảo: https://man7.org/linux/man-pages/man8/ping.8.html, https://man7.org/linux/man-pages/man8/tracepath.8.html

## VPS-02-008/P2

Thay2packetsreceived bằng echo và thốngkêping cho payload1200.

Command trước: `ping -M do -s 1200 198.51.100.20`; sau: `ping -M do -s 1200 198.51.100.20`.

Trước:

```text
2 packets received
```

Sau:

```text
PING 198.51.100.20 (198.51.100.20) 1200(1228) bytes of data.
1208 bytes from 198.51.100.20: icmp_seq=1 ttl=52 time=31.2 ms
1208 bytes from 198.51.100.20: icmp_seq=2 ttl=52 time=31.4 ms
--- 198.51.100.20 ping statistics ---
2 packets transmitted, 2 received, 0% packet loss
```

Tham khảo: https://man7.org/linux/man-pages/man8/ping.8.html, https://man7.org/linux/man-pages/man8/tracepath.8.html

## VPS-03-007/P2

Bổ sung header và cột limits đúng dạng /proc/PID/limits.

Command trước: `cat /proc/1234/limits`; sau: `cat /proc/1234/limits`.

Trước:

```text
Max open files 1024 1024 files
```

Sau:

```text
Limit                     Soft Limit           Hard Limit           Units
Max open files            1024                 1024                 files
```

Tham khảo: https://man7.org/linux/man-pages/man5/proc_pid_limits.5.html, https://man7.org/linux/man-pages/man2/getrlimit.2.html

## VPS-03-008/P2

EXT4-fs error detected là tóm tắt; dùng dòng kernel cùng device/timestamp của extra hiện có.

Command trước: `journalctl -k -b -p err`; sau: `journalctl -k -b -p err`.

Trước:

```text
EXT4-fs error detected
```

Sau:

```text
Oct 22 07:14:02 vps kernel: EXT4-fs error (device vda1): ext4_find_entry: inode #2
```

Tham khảo: https://man7.org/linux/man-pages/man8/e2fsck.8.html, https://man7.org/linux/man-pages/man8/findmnt.8.html

## VPS-04-006/P1

Thêmheaderps; giữ850000KiB vàelapsed 9h.

Command trước: `ps -o pid,rss,etime,comm -p 1200`; sau: `ps -o pid,rss,etime,comm -p 1200`.

Trước:

```text
1200 850000 09:00:00 myapp
```

Sau:

```text
  PID   RSS     ELAPSED COMMAND
 1200 850000   09:00:00 myapp
```

Tham khảo: https://man7.org/linux/man-pages/man1/ps.1.html, https://www.freedesktop.org/software/systemd/man/latest/systemd.resource-control.html

## VPS-04-007/G1

vmstat 1 2 phải có hai dòng số; thêm khoảng đo thứ hai và giải thích dòng since-boot.

Command trước: `vmstat 1 2`; sau: `vmstat 1 2`.

Trước:

```text
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b swpd free buff cache si so bi bo in cs us sy id wa st
 2  0    0 85240 18000 102400 0  0  0  0 240 320 5 4 41 0 50
```

Sau:

```text
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b swpd free buff cache si so bi bo in cs us sy id wa st
 2  0    0 85240 18000 102400 0 0 0 0 240 320 5 4 41 0 50
 2  0    0 85240 18000 102400 0 0 0 0 242 325 5 4 41 0 50
```

Tham khảo: https://man7.org/linux/man-pages/man8/vmstat.8.html, https://man7.org/linux/man-pages/man1/top.1.html

## VPS-04-008/P1

Bỏ prose chấm phẩy, dùng hai dòng journalstarted/finished cótimestamp.

Command trước: `journalctl -u backup-agent --since "2026-10-22 02:00:00 UTC" --until "2026-10-22 02:30:00 UTC"`; sau: `journalctl -u backup-agent --since "2026-10-22 02:00:00 UTC" --until "2026-10-22 02:30:00 UTC" --utc`.

Trước:

```text
Oct 22 02:00:00 vps backup-agent[901]: backup started
Oct 22 02:20:00 vps backup-agent[901]: backup finished
```

Sau:

```text
Oct 22 02:00:00 vps backup-agent[901]: backup started
Oct 22 02:20:00 vps backup-agent[901]: backup finished
```

Tham khảo: https://man7.org/linux/man-pages/man8/iostat.8.html, https://www.freedesktop.org/software/systemd/man/latest/journalctl.html

## VPS-04-008/P2

Thay during backup prose bằng hai báo cáo iostat với r_await/w_await; quan hệ với backup nằm ở explanation.

Command trước: `iostat -xz 1 2`; sau: `iostat -xz 1 2`.

Trước:

```text
vda await 95.0 during backup
```

Sau:

```text
avg-cpu:  %user %nice %system %iowait %steal %idle
           8.00  0.00    4.00    5.00   0.00 83.00
Device r/s rkB/s rrqm/s %rrqm r_await rareq-sz w/s wkB/s wrqm/s %wrqm w_await wareq-sz d/s dkB/s drqm/s %drqm d_await dareq-sz f/s f_await aqu-sz %util
vda 20.00 2560.00 0.00 0.00 5.00 128.00 10.00 1280.00 0.00 0.00 5.00 128.00 0.00 0.00 0.00 0.00 0.00 0.00 1.00 5.00 0.15 20.00

avg-cpu:  %user %nice %system %iowait %steal %idle
           8.00  0.00    4.00   50.00   0.00 38.00
Device r/s rkB/s rrqm/s %rrqm r_await rareq-sz w/s wkB/s wrqm/s %wrqm w_await wareq-sz d/s dkB/s drqm/s %drqm d_await dareq-sz f/s f_await aqu-sz %util
vda 80.00 10240.00 0.00 0.00 95.00 128.00 20.00 2560.00 0.00 0.00 95.00 128.00 0.00 0.00 0.00 0.00 0.00 0.00 2.00 95.00 9.69 90.00
```

Tham khảo: https://man7.org/linux/man-pages/man8/iostat.8.html, https://www.freedesktop.org/software/systemd/man/latest/journalctl.html

## VPS-05-008/P1

Hoàn thiện outputlsblkdefault có MAJ:MIN/RM/RO, giữlayout80/30.

Command trước: `lsblk`; sau: `lsblk`.

Trước:

```text
NAME          SIZE TYPE MOUNTPOINTS
vdb            80G disk
└─vdb1         80G part
  └─vgdata-lvdata 30G lvm /data
```

Sau:

```text
NAME                MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
vdb                 252:16   0  80G  0 disk
└─vdb1              252:17   0  80G  0 part
  └─vgdata-lvdata   253:0    0  30G  0 lvm  /data
```

Tham khảo: https://man7.org/linux/man-pages/man8/vgs.8.html, https://man7.org/linux/man-pages/man8/lvextend.8.html, https://man7.org/linux/man-pages/man8/xfs_growfs.8.html

## VPS-07-005/P1

Lệnh x509-noout-dates in cả notBefore và notAfter, thay fragment thiếu dòng đầu.

Command trước: `echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -dates`; sau: `echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -dates`.

Trước:

```text
notAfter=Sep 01 00:00:00 2026 GMT
```

Sau:

```text
notBefore=Jun  3 00:00:00 2026 GMT
notAfter=Sep  1 00:00:00 2026 GMT
```

Tham khảo: https://docs.openssl.org/3.0/man1/openssl-x509/

## VPS-07-008/P2

Định dạng curl time_total là số giây thập phân; giữ giá trị 31,4 giây với fixture 31.400000.

Command trước: `curl -s -o /dev/null -w "%{time_total}" http://127.0.0.1:3000/health`; sau: `curl -s -o /dev/null -w "%{time_total}" http://127.0.0.1:3000/health`.

Trước:

```text
31.4
```

Sau:

```text
31.400000
```

Tham khảo: https://nginx.org/en/docs/, https://curl.se/docs/manpage.html

## VPS-08-008/P1

SERVFAILdạngheaderdig.

Command trước: `dig @1.1.1.1 signed.example.test A`; sau: `dig @1.1.1.1 signed.example.test A`.

Trước:

```text
status: SERVFAIL
```

Sau:

```text
;; ->>HEADER<<- opcode: QUERY, status: SERVFAIL, id: 19819
```

Tham khảo: https://bind9.readthedocs.io/en/v9.18.41/manpages.html#dig-dns-lookup-utility, https://www.rfc-editor.org/rfc/rfc6605.html

## VPS-08-008/P2

Giữ status NOERROR với +cd và thêm A answer đúng định dạng dig; kết quả này không tự xác minh DNSSEC chain.

Command trước: `dig @1.1.1.1 signed.example.test A +cd`; sau: `dig @1.1.1.1 signed.example.test A +cd`.

Trước:

```text
status: NOERROR
```

Sau:

```text
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 19820
;; flags: qr rd ra cd; QUERY: 1, ANSWER: 1
;; ANSWER SECTION:
signed.example.test. 300 IN A 198.51.100.20
```

Tham khảo: https://bind9.readthedocs.io/en/v9.18.41/manpages.html#dig-dns-lookup-utility, https://www.rfc-editor.org/rfc/rfc6605.html

## VPS-08-008/G2

ThayAwEAAa...placeholdervàkeyformatkhôngđúngalgorithm13bằngpublictestkeyRFC6605section6.1.

Command trước: `dig @ns1.signed.example.test signed.example.test DNSKEY +dnssec`; sau: `dig @ns1.signed.example.test signed.example.test DNSKEY +dnssec`.

Trước:

```text
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 21044
;; ANSWER SECTION:
signed.example.test. 3600 IN DNSKEY 257 3 13 AwEAAa...␠
```

Sau:

```text
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 21044
;; ANSWER SECTION:
signed.example.test. 3600 IN DNSKEY 257 3 13 GojIhhXUN/u4v54ZQqGSnyhWJwaubCvTmeexv7bR6edbkrSqQpF64cYbcB7wNcP+e+MAnLr+Wi9xMWyQLc8NAA==
```

Tham khảo: https://bind9.readthedocs.io/en/v9.18.41/manpages.html#dig-dns-lookup-utility, https://www.rfc-editor.org/rfc/rfc6605.html

## VPS-06-005/G1

f2b1-root/cafe1234 không có dạng UUID ext4; thay bằng UUID 36 ký tự, vẫn không khớp deadbeef.

Command trước: `blkid`; sau: `blkid`.

Trước:

```text
/dev/vda1: UUID="f2b1-root" TYPE="ext4"
/dev/vdb1: UUID="cafe1234" TYPE="ext4"
```

Sau:

```text
/dev/vda1: UUID="f2b1d098-6d41-4af5-9b31-6c6a1d08c201" TYPE="ext4"
/dev/vdb1: UUID="cafe1234-4265-4e01-9310-71aa58e0b100" TYPE="ext4"
```

Tham khảo: https://man7.org/linux/man-pages/man8/blkid.8.html, https://man7.org/linux/man-pages/man5/fstab.5.html

## VPS-10-002/P1

ip-br-link mặc định có link address/flags; bổ sung phần lo thực tế, không thêm NIC.

Command trước: `ip -br link`; sau: `ip -br link`.

Trước:

```text
lo UNKNOWN
```

Sau:

```text
lo UNKNOWN 00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>
```

Tham khảo: https://libvirt.org/manpages/virsh.html, https://man7.org/linux/man-pages/man8/ip-link.8.html

## VPS-10-003/P1

Dòng vnet4 bridge br-storage thiếu header/model/MAC; bổ sung bảng domiflist hợp lý, giữ source bridge.

Command trước: `virsh domiflist vm-102`; sau: `virsh domiflist vm-102`.

Trước:

```text
vnet4 bridge br-storage
```

Sau:

```text
Interface Type Source Model MAC
-------------------------------------------------------
vnet4 bridge br-storage virtio 52:54:00:ab:10:02
```

Tham khảo: https://libvirt.org/manpages/virsh.html

## VPS-10-004/P1

top -b -n1 | head phải gồm summary/header trước dòng process; thêm 10 dòng với st=60% và các CPU category cộng 100%.

Command trước: `top -b -n1 | head`; sau: `top -b -n1 | head`.

Trước:

```text
%Cpu(s): 60.0 st
```

Sau:

```text
top - 09:05:00 up 3 days,  2 users,  load average: 4.80, 4.21, 3.90
Tasks: 118 total,   1 running, 117 sleeping,   0 stopped,   0 zombie
%Cpu(s):  5.0 us,  3.0 sy,  0.0 ni, 30.0 id,  2.0 wa,  0.0 hi,  0.0 si, 60.0 st
MiB Mem :   4096.0 total,    740.0 free,   2100.0 used,   1256.0 buff/cache
MiB Swap:   1024.0 total,   1024.0 free,      0.0 used.   1650.0 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
   1042 app       20   0  522000  98000  12000 S   8.0   2.3   3:12.00 app
    741 root      20   0  160000   8200   5400 S   1.0   0.2   0:41.00 sshd
      1 root      20   0  168000  12000   7800 S   0.0   0.3   0:20.00 systemd
```

Tham khảo: https://libvirt.org/manpages/virsh.html, https://man7.org/linux/man-pages/man1/top.1.html

## VPS-10-004/P2

Thay cụm mô tả node saturation không phải output panel bằng bản ghi metric có node và cửa sổ đo.

Command trước: `PANEL: host metrics`; sau: `PANEL: host metrics`.

Trước:

```text
node hypervisor saturation
```

Sau:

```text
node=node-4 metric=cpu_ready state=high window=2026-10-22T09:00:00Z/2026-10-22T09:20:00Z
```

Tham khảo: https://libvirt.org/manpages/virsh.html, https://man7.org/linux/man-pages/man1/top.1.html

## VPS-10-005/P1

Source vda 25G only là mô tả tiếng Anh, thay bằng bảng NAME/SIZE/TYPE lsblk tối thiểu.

Command trước: `lsblk`; sau: `lsblk`.

Trước:

```text
vda 25G only
```

Sau:

```text
NAME MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
vda  252:0    0  25G  0 disk
```

Tham khảo: https://libvirt.org/manpages/virsh.html, https://man7.org/linux/man-pages/man8/lsblk.8.html

## VPS-10-008/G1

Đổi Ubuntu sang CentOS Stream 9 theo guest_os gốc; giữ dạng /etc/os-release.

Command trước: `cat /etc/os-release`; sau: `cat /etc/os-release`.

Trước:

```text
ID=ubuntu
VERSION_ID="24.04"
```

Sau:

```text
ID="centos"
VERSION_ID="9"
```

Tham khảo: https://www.freedesktop.org/software/systemd/man/latest/journalctl.html, https://chrony-project.org/documentation.html

## VPS-10-008/G2

Đổi systemd-timesyncd Ubuntu sang chronyd CentOS trong lệnh và output Guided.

Command trước: `systemctl status systemd-timesyncd`; sau: `systemctl status chronyd`.

Trước:

```text
● systemd-timesyncd.service - Network Time Synchronization
   Active: inactive (dead)
```

Sau:

```text
● chronyd.service - NTP client/server
     Loaded: loaded (/usr/lib/systemd/system/chronyd.service; disabled)
     Active: inactive (dead)
```

Tham khảo: https://www.freedesktop.org/software/systemd/man/latest/journalctl.html, https://chrony-project.org/documentation.html

## VPS-09-005/P2

ss-tunap có Netid khi chọnTCP/UDP; bổ sung header/tcp,giữ nguyên socket.

Command trước: `ss -tunap`; sau: `ss -tunap`.

Trước:

```text
ESTAB 0 0 198.51.100.20:45000 203.0.113.25:25 users:(("python3",pid=1802,fd=9))
```

Sau:

```text
Netid State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
tcp ESTAB 0 0 198.51.100.20:45000 203.0.113.25:25 users:(("python3",pid=1802,fd=9))
```

Tham khảo: https://man7.org/linux/man-pages/man8/ss.8.html

## VPS-09-007/P1

Fingerprint mẫu ban đầu quá ngắn so với SHA-256 fingerprint OpenSSH; thay chuỗi mẫu 43 ký tự.

Command trước: `journalctl -u sshd --since "2026-10-22 09:00:00 UTC" --until "2026-10-22 09:30:00 UTC"`; sau: `journalctl -u sshd --since "2026-10-22 09:00:00 UTC" --until "2026-10-22 09:30:00 UTC" --utc`.

Trước:

```text
Oct 22 09:14:20 vps sshd[3104]: Accepted publickey for root from 203.0.113.77 port 51144 ssh2: ED25519 SHA256:AbCdEf123456
```

Sau:

```text
Oct 22 09:14:20 vps sshd[3104]: Accepted publickey for root from 203.0.113.77 port 51144 ssh2: ED25519 SHA256:uXzRs1YoPvjS/9wVRD4Zf1uTj3PseKqFLu6q0HD1mOk
```

Tham khảo: https://www.openssh.com/manual.html, https://www.freedesktop.org/software/systemd/man/latest/journalctl.html

## VPS-09-007/G1

Đồng bộ fingerprint cùng sự kiện ở cửa sổ log cố định.

Command trước: `journalctl -u sshd --since "2026-10-22 00:00:00" --no-pager`; sau: `journalctl -u sshd --since "2026-10-22 09:00:00 UTC" --until "2026-10-22 09:30:00 UTC" --utc --no-pager`.

Trước:

```text
Oct 22 09:14:20 vps sshd[3104]: Accepted publickey for root from 203.0.113.77 port 51144 ssh2: ED25519 SHA256:AbCdEf123456
```

Sau:

```text
Oct 22 09:14:20 vps sshd[3104]: Accepted publickey for root from 203.0.113.77 port 51144 ssh2: ED25519 SHA256:uXzRs1YoPvjS/9wVRD4Zf1uTj3PseKqFLu6q0HD1mOk
```

Tham khảo: https://www.openssh.com/manual.html, https://www.freedesktop.org/software/systemd/man/latest/journalctl.html

## VPS-13-001/P1

Thay câu api Exited bằng bảng docker ps -a, giữ container/exit status.

Command trước: `docker ps -a`; sau: `docker ps -a`.

Trước:

```text
api Exited (1) 2 minutes ago
```

Sau:

```text
CONTAINER ID   IMAGE      COMMAND            CREATED         STATUS                     PORTS   NAMES
a4c21d02f881   api:v2.0   "python app.py"    5 minutes ago   Exited (1) 2 minutes ago           api
```

Tham khảo: https://docs.docker.com/reference/cli/docker/container/ls/

## VPS-13-001/P2

Dùng dạng thông báo Python missing module chuẩn cho cùng appconfig.

Command trước: `docker logs api --tail 20`; sau: `docker logs api --tail 20`.

Trước:

```text
ModuleNotFoundError: appconfig
```

Sau:

```text
ModuleNotFoundError: No module named 'appconfig'
```

Tham khảo: https://docs.python.org/3/library/exceptions.html#ModuleNotFoundError

## VPS-13-005/P2

getent hosts entry cần IP và hostname, source chỉ IP; thêm example.com không thay đổi kết quả lookup.

Command trước: `getent hosts example.com`; sau: `getent hosts example.com`.

Trước:

```text
93.184.215.14
```

Sau:

```text
93.184.215.14  example.com
```

Tham khảo: https://man7.org/linux/man-pages/man1/getent.1.html

## VPS-13-007/P1

Compose ps mặc định chỉ running; dùng --all và bảng đủ cột để hiện db Exited, không alias lệnh cũ sai.

Command trước: `docker compose ps`; sau: `docker compose ps --all`.

Trước:

```text
NAME   IMAGE       SERVICE   STATUS
api    api:v2.0    api       Up 2 minutes
db     mariadb:11  db        Exited (1) 2 minutes ago
```

Sau:

```text
NAME   IMAGE        COMMAND                  SERVICE   CREATED         STATUS                     PORTS
api    api:v2.0     "python app.py"          api       5 minutes ago   Up 2 minutes
db     mariadb:11   "docker-entrypoint.sh"   db        5 minutes ago   Exited (1) 2 minutes ago
```

Tham khảo: https://docs.docker.com/reference/cli/docker/compose/ps/

## VPS-13-007/G2

Thêm header free -h, giữ các số liệu RAM/Swap cũ.

Command trước: `free -h`; sau: `free -h`.

Trước:

```text
Mem:  4.0Gi  2.7Gi  400Mi  100Mi  900Mi  700Mi
Swap: 0B 0B 0B
```

Sau:

```text
               total        used        free      shared  buff/cache   available
Mem:           4.0Gi       2.7Gi       400Mi       100Mi       900Mi       700Mi
Swap:             0B          0B          0B
```

Tham khảo: https://man7.org/linux/man-pages/man1/free.1.html

## VPS-11-005/P2

Thay mô tả vda 30G, no vdb bằng bảng device, giữ bằng chứng vda-only.

Command trước: `lsblk`; sau: `lsblk`.

Trước:

```text
vda 30G, no vdb
```

Sau:

```text
NAME   MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
vda    252:0    0  30G  0 disk
└─vda1 252:1    0  30G  0 part /
```

Tham khảo: https://man7.org/linux/man-pages/man8/lsblk.8.html

## VPS-11-007/P1

Thêm prefix đúng dạng journal cho cùng event key rejected, timestamp nhất quán rotation audit.

Command trước: `journalctl -u backup-agent -n 30`; sau: `journalctl -u backup-agent -n 30`.

Trước:

```text
Authentication failed: key rejected
```

Sau:

```text
Oct 22 01:35:11 vm-117 backup-agent[2140]: Authentication failed: key rejected
```

Tham khảo: https://www.freedesktop.org/software/systemd/man/latest/journalctl.html

## VPS-12-003/P2

Sửa ID và VERSION_ID từ cùng dòng thành new line assignment s, giữ Ubuntu 24.04.

Command trước: `cat /etc/os-release`; sau: `cat /etc/os-release`.

Trước:

```text
ID=ubuntu VERSION_ID=24.04
```

Sau:

```text
ID=ubuntu
VERSION_ID="24.04"
```

Tham khảo: https://www.freedesktop.org/software/systemd/man/latest/os-release.html

## VPS-12-006/P2

Chuỗi gốc gộp header và inet; sửa dạng ip addr thật, giữ 203.0.113.40/24.

Command trước: `ip -4 addr`; sau: `ip -4 addr`.

Trước:

```text
2: ens3    inet 203.0.113.40/24 brd 203.0.113.255 scope global ens3
```

Sau:

```text
2: ens3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    inet 203.0.113.40/24 brd 203.0.113.255 scope global ens3
       valid_lft forever preferred_lft forever
```

Tham khảo: https://man7.org/linux/man-pages/man8/ip-address.8.html
