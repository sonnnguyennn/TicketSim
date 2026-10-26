# Phase D2 — Command Knowledge System QA

## Phạm vi và baseline

Tiếp tục từ `6e44867`. Đã đọc `AGENTS.md`, mở đầu living spec, `Phase_D1_Correctness_QA.md`, audit Phase C và source của Command Library. Baseline sạch: 112 Guided, 122 Command IDs, 620 câu hỏi, 102 effective fixture deltas; `npm run audit:content` 0 lỗi, 34/34 unit, 42/42 browser, build đạt. Không mở thêm Stateful/Exam, không đổi progress v5, answer keys hoặc source 112 ticket.

## Kết quả nội dung

| Hạng mục | Kết quả |
|---|---:|
| Thẻ có dữ liệu knowledge và review ledger | 122/122 |
| Shell/Network/System | 102 |
| Provider/Panel/Billing/Backup support tasks | 20 |
| Thẻ shell có ít nhất một structured flag/subcommand/argument thực dụng | 91/102 |
| Structured option records | 151 |
| Usage examples có purpose, output và interpretation riêng | 139 |
| Ví dụ thứ hai được bổ sung có chủ đích | 17 |
| `SOURCE_VERIFIED` (cú pháp/hành vi theo manual) | 70 |
| `PENDING` (chưa có đối chiếu nguồn độc lập ở D2) | 32 |
| `INTERNAL_SOP_REQUIRED` (tác vụ provider/support) | 20 |
| `LAB_VERIFIED` | 0 |

[Ledger 122 thẻ](Phase_D2_Command_Review_Ledger.csv) có ID, family, loại, source location, số options/examples, mức xác minh, ghi chú review kế thừa và việc còn chờ. `REASONED_REVIEW` nghĩa là đọc nội dung và kiểm tra tính nhất quán trong repo; Phase C đã rà trực tiếp 122 thẻ ở mức reasoned. Đây không phải bằng chứng một command đã được chạy trên CentOS/Ubuntu hoặc panel thật. Output mẫu là authored excerpt; fixture của TicketSim không được dùng làm xác minh độc lập.

## Mô hình và UX

| Trước D2 | D2 | Ví dụ áp dụng |
|---|---|---|
| `flags: string` gộp nhiều ý | `options[]` với name/purpose/when/example/osNote | `ss -ltnp` tách `-l/-t/-n/-p`; `ssh -o BatchMode=yes` phân biệt với `-vvv`. |
| Một `exampleOutput` và `interpretation` | `examples[]` có mục đích, output, cách đọc, context và nhãn excerpt | `journalctl` có ví dụ UTC; `openssl s_client` có ví dụ xác minh hostname/chain. |
| `PANEL:` dùng chung layout command | `kind: support_task` và `task` metadata | Backup task hiển thị target/quota, approval và escalation, không là lệnh shell. |

- `CommandKnowledge` bổ sung `kind`, `syntax`, từng `CommandOption` (tên, công dụng, khi dùng, ví dụ, OS note), nhiều `CommandUsage` (purpose, output, interpretation, context, excerpt), ranh giới kết luận và mức xác minh. Các trường cũ vẫn còn để Guided/Practice liên kết theo ID.
- 102 thẻ shell có ví dụ đầu kế thừa nội dung đã biên soạn; 17 ví dụ thứ hai được thêm ở các tình huống SSH, route, journal UTC, firewall zone, disk/inode, DNS, Docker, TLS và capture. 11 thẻ shell không có structured option vì ví dụ cơ bản không cần flag riêng, như `getenforce`, `hostnamectl`, `uptime`, `nproc`, `stat`.
- 20 thẻ panel/support hiển thị như tác vụ: nơi thực hiện, dữ liệu, quyền, trạng thái, giới hạn và escalation. Tên `PANEL:`, `BILLING:`, `BACKUP LOG:` là nhãn fixture cũ, không phải tên nút hay SOP GreenCloud được xác nhận.
- Thư viện có xem nhanh và phần mở rộng; tìm theo command, purpose, flag, symptom, output và dữ liệu tác vụ. Quick Lookup trong Guided chỉ hiện tóm tắt, không đẩy toàn bộ thẻ dài vào workspace.

## Findings mới và xử lý

| ID | Mức | Vị trí nguồn | Bằng chứng và phạm vi | Sửa |
|---|---|---|---|---|
| D2-01 | Major kỹ thuật | `src/guided/moreCommands.ts:13`, `src/guided/commandRevisions.ts:20` | `grep port` cũng khớp `gatewayports`; Guided hiện có ví dụ output đó. Chỉ áp dụng khi lọc output `sshd -T`. | Thẻ dùng `grep '^port '`; ví dụ phụ giải thích bộ lọc rộng và shell pipe. Guided fixture cũ được giữ với output đúng phạm vi. |
| D2-02 | Major kỹ thuật | `scripts/guided-content.mjs:1394` (`VPS-09-007/G1`) | G1 trước dùng `--since "2026-10-22 00:00:00"` không timezone; log fixture của incident là 09:14 UTC. | Khóa G1 vào 09:00–09:30 UTC và thêm `--utc` cho thời gian hiển thị; generated Guided được tái tạo. |
| D2-03 | Major kỹ thuật | `src/guided/moreCommands.ts:26`, `src/guided/commandRevisions.ts:23` | `-servername` gửi SNI nhưng `s_client` có thể tiếp tục sau lỗi verify; subject CN không chứng minh hostname/chain. | Thêm `-verify_hostname`, `-verify_return_error`, ví dụ và giới hạn kết luận. |
| D2-04 | Minor kỹ thuật | `src/guided/moreCommands.ts:20`, `src/guided/commandRevisions.ts:22` | Unit file in ra là bản trên đĩa; sau sửa mà chưa `daemon-reload`, manager có thể dùng bản cũ. | Nêu rõ ranh giới on-disk/runtime và nguy cơ lộ Environment. |
| D2-05 | Minor nội dung | `src/guided/moreCommands.ts:92`, `src/guided/commandRevisions.ts:21` | Tổ hợp cũ đặt service trước `--tail`; cú pháp canonical của Docker docs đặt option trước service. | Dùng `docker compose logs --tail 10 db`; mô tả subcommand và service riêng. |
| D2-06 | Minor an toàn | `src/guided/moreCommands.ts:46`, `src/guided/commandRevisions.ts:41` | Manual upstream cho biết mỗi lần đo tạo lưu lượng đáng kể. | Nhấn mạnh số lượt hữu hạn, nguồn được phép và giới hạn ICMP. |
| D2-07 | Regression UI, đã sửa | `src/guided/CommandLibrary.tsx:41` | Lần chạy browser đầu: stdout rỗng bị render thành câu giải thích trong `pre`; test cũ phát hiện. | Giữ `pre` rỗng, đặt giải thích ngoài output; browser 43/43. |

Nguồn kỹ thuật trực tiếp: [systemd systemctl](https://www.freedesktop.org/software/systemd/man/latest/systemctl.html), [journalctl](https://www.freedesktop.org/software/systemd/man/latest/journalctl.html), [OpenSSH ssh_config](https://man7.org/linux/man-pages/man5/ssh_config.5.html), [sshd](https://man7.org/linux/man-pages/man8/sshd.8.html), [OpenSSL s_client](https://docs.openssl.org/3.0/man1/openssl-s_client/), [Docker Compose logs](https://docs.docker.com/reference/cli/docker/compose/logs/), [upstream MTR manual](https://github.com/traviscross/mtr/blob/master/man/mtr.8.in). Các URL riêng cho 70 thẻ ở ledger. `SOURCE_VERIFIED` chỉ xác nhận cú pháp và ý nghĩa option/command trong manual, không xác minh output minh họa, quyền thực tế hoặc hệ quả production.

## Phần chưa xác minh

32 thẻ `PENDING`: getent-passwd, getenforce, fail2ban-status, id-user, cgroup-cpu-stat, ls-key-mode, os-release, hostnamectl, ping, nc-port, firewall-state, nft-rules, ls-permission, ausearch-avc, uptime, vmstat, iostat, dmesg-tail, lvm-report, nginx-error-tail, sha256sum, tar-list, fstab-read, stat-file, timedatectl, date-utc, last-logins, sudoers-read, crontab-read, sysctl-read, getent-hosts, nproc. Cần đối chiếu manual chính thức theo phiên bản trước khi nâng nhãn.

**122/122 thẻ chưa `LAB_VERIFIED`.** Không có lab CentOS Stream 9/Ubuntu hoặc provider/control-plane được cung cấp; cần chạy trong lab cách ly, lưu command/version/exit status/output thật và đối chiếu từng assertion. Những khác biệt OS trong thẻ vẫn là hướng dẫn có điều kiện theo image/service manager thực tế.

23 ticket Phase C cần SOP/owner vẫn giữ pending: VPS-06-003, VPS-06-004, VPS-10-001, VPS-10-003, VPS-10-005, VPS-09-005, VPS-09-006, VPS-09-008, VPS-11-001, VPS-11-004, VPS-11-005, VPS-11-006, VPS-12-001, VPS-12-005, VPS-12-006, VPS-14-001, VPS-14-002, VPS-14-003, VPS-14-004, VPS-14-005, VPS-14-006, VPS-14-007, VPS-14-008. D2 không viết SOP nội bộ, không khẳng định role support có quyền host, billing, abuse, backup restore hoặc production changes.

## Verification

Sau thay đổi: `npm run prepare-data`, `npm run audit:content` (0 lỗi, 112 Guided/122 cards/620 questions/102 fixture deltas), `npm test -- --run` (36/36), `npm run build` (đạt, cảnh báo bundle >500 kB), `npm run test:browser` (43/43). Browser bao gồm desktop/mobile, Guided-first, Quick Lookup, tìm flag, tác vụ support, keyboard, grading, progress v5, import/export/migration và 14 đường topic đại diện. Không thử end-to-end riêng mọi ticket hoặc thao tác hệ thống thật. Unit D2 giữ ID mapping và safety action labels; audit D2 xác thực shape, boundary, source URL và SOP kind.

## Phase D3

1. Đối chiếu manual chính thức cho 32 thẻ `PENDING`, ưu tiên security, firewall, backup/virtualization tools; bổ sung nguồn theo phiên bản OS cụ thể.
2. Chạy lab cách ly CentOS Stream 9/Ubuntu cho 122 thẻ theo mức cần thiết, đặc biệt `ss`, `journalctl --utc`, SSH debug/BatchMode, DNS, `top`, `lsblk`, TLS và restore; lưu output/exit status thật.
3. Nhận SOP từ owner cho 23 ticket và 20 task cards, xác nhận role/approval, tên hệ thống, trạng thái, escalation và backup/restore proof trước khi hướng dẫn vận hành thực tế.
