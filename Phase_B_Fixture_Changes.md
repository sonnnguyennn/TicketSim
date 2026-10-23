# Phase B — Guided-only fixture corrections

Source112 và output đã lưu trong tiến độ không bị viết lại. Các mẫu bên dưới được biên soạn theo định dạng tài liệu tham khảo; không chạy trên VPS thật.

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

## VPS-09-007/P1

Fingerprint mẫu ban đầu quá ngắn so với SHA256 fingerprint OpenSSH; thay chuỗi mẫu 43 ký tự.

Command trước: `journalctl -u sshd --since today`; sau: `journalctl -u sshd --since today`.

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

Command trước: `journalctl -u sshd --since "2026-10-22 00:00:00" --no-pager`; sau: `journalctl -u sshd --since "2026-10-22 00:00:00" --no-pager`.

Trước:

```text
Oct 22 09:14:20 vps sshd[3104]: Accepted publickey for root from 203.0.113.77 port 51144 ssh2: ED25519 SHA256:AbCdEf123456
```

Sau:

```text
Oct 22 09:14:20 vps sshd[3104]: Accepted publickey for root from 203.0.113.77 port 51144 ssh2: ED25519 SHA256:uXzRs1YoPvjS/9wVRD4Zf1uTj3PseKqFLu6q0HD1mOk
```

Tham khảo: https://www.openssh.com/manual.html, https://www.freedesktop.org/software/systemd/man/latest/journalctl.html
