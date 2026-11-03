# Đánh giá tích hợp HyperV_TicketLab — 03/11/2026

## Kết luận

Nên dùng `E:\Document\HyperV_TicketLab` làm nguồn nội dung và logic scenario, chuyển sang Real Lab engine của TicketSim. Không chạy nguyên script từ web và không cấp quyền điều khiển lab1. M3 đã PASS thực tế nên không cần làm lại giai đoạn A của đề xuất PM. Tiếp theo là một phần nền M4 dùng chung, rồi port lần lượt LAB-02 → LAB-03 → LAB-07; chưa cần nhập cả 16 bài hoặc làm xong toàn bộ installer trước khi viết adapter.

Đây là phân tích source/tài liệu, không phải chứng nhận 16 bài đã chạy trên ticketsim-lab. Không script lab, provision, fault, reset hay service deployment nào được thực thi trong lần đánh giá này. Phê duyệt M3 cũ đã tiêu thụ, không cấp quyền cho các trial mới.

## Những gì source xác nhận

| Bằng chứng | Hệ quả tích hợp |
|---|---|
| `00_Bootstrap.ps1` tạo Python HTTP service, User=nobody, port 18080, nội dung TICKETLAB HEALTHY | LAB-02/03 cần prepare riêng; B5 có Nginx không đồng nghĩa đã có service này. |
| `02_Web_Unexpected_Response.ps1` chỉ chmod 000 trang web, không kiểm chứng HTTP sau mutation | Phải bổ sung fault verification từ guest và Windows; không dùng thông báo ready làm grade. |
| `03_Port_Conflict.ps1` tạo transient occupier, xác minh decoy qua localhost | Giữ ý tưởng, thêm client probe, unit/listener identity và healthy pre-injection check. |
| `_internal/07.sh` dựng app và Nginx proxy đã sai upstream, yêu cầu firewalld active và zone public | Tách prepare/inject; không cài/bật firewalld chỉ để đáp ứng giả định của script. |
| `_internal/09.sh` chown/runuser ubuntu | Phải chuyển identity theo contract TicketSim, không chỉ thay IP. |
| `_Advanced_Common.ps1`, `_Batch3_Common.ps1` gửi base64 Bash rồi sudo -n bash -se; tự rollback khi setup lỗi | Không tái sử dụng transport này cho API; một engine phải sở hữu recovery và journal. |
| `_batch3/verify.sh` có kiểm tra nhiều request, dependency endpoints, latency, catalog/checkout | Tái sử dụng thiết kế verifier; bổ sung điều kiện chống sửa tắt và định lượng ổn định. |
| LAB-14 inject chậm >=1s, verify sửa <1.5s | Hai khoảng chồng lấn: có thể PASS dù chưa sửa nếu phản hồi 1–1.5s. Cần thiết kế lại ngưỡng và lấy mẫu. |
| LAB-16 fault kiểm tra có 200/503 nhưng chưa xác minh stale body ở vòng frontend | Bổ sung kiểm chứng cả hai triệu chứng trước khi giao bài. |
| LAB-05 cố lấp tmpfs nhưng che lỗi dd, chưa xác minh đầy mount | Bổ sung mount identity, dung lượng/inode và thao tác thất bại thực tế trước ready. |
| LAB-06 dùng Disconnect-VMNetworkAdapter trên lab1 | Loại khỏi pack ban đầu; làm mất cả đường SSH terminal, cần recovery/console ngoài băng đã kiểm định. |
| QA_V5/QA_Batch3/README phân biệt QA tĩnh và kiểm thử thật | Không ghi available/qualified chỉ vì script có SCENARIO_READY hoặc bash syntax PASS. |

## Các điểm engine hiện tại phải thay đổi

TicketSim đã có lease, durable operations, terminal revocation, grade-before-reset, B5 recovery và finalization. Không xây backend mới. Tuy nhiên hiện tại chưa phải engine đa scenario:

- `agent/registry.mjs`: live registry chỉ nhận một entry/action/checklist cố định.
- `agent/livePolicy.mjs`: approval chỉ nhận LAB-WEB-001; grade/fault checks toàn cục theo bài Nginx port 80.
- `agent/liveOperations.mjs`: inject chỉ stop Nginx; HTTP luôn target port 80/body baseline; SSH allowlist cố định.
- `agent/liveService.mjs`: chưa có prepare/verify healthy environment; lấy checklist toàn cục. Bổ sung preparation cần journal mutation trước tác động và recovery khi prepare thất bại, kể cả chưa inject.
- `agent/webPilot.mjs`, `src/real-lab/RealLabPage.tsx`: hardcode bài, thời hạn 25 phút, một lượt real trong toàn DB; state hiện chỉ trỏ active/latest run.
- `agent/trialPermit.mjs`, `operator/server.mjs`, `agent/trialReport.mjs`: cơ chế first-trial và report đúng một run. Mở rộng phải có approval mới theo run/scenario/revision/digest; không bỏ guard rồi tái dùng permit cũ. Báo cáo lịch sử phải chọn run cụ thể.
- `src/real-lab/manifest.schema.json`: ID hiện bắt đầu LAB-, nên dùng `LAB-TLAB-002/003/007`, không dùng trực tiếp TLAB-03 nếu chưa version schema.
- `scripts/real-lab/agent-command.sh`, sudoers: chưa cho deploy bundle, tạo service, chmod hay Nginx reload. Không thể thêm JSON manifest là chạy được.

## Gate quan trọng nhất: triển khai guest sau B5 reset

B5 chứa dispatcher cũ. Cập nhật dispatcher/script chỉ trên guest đang chạy sẽ bị checkpoint reset xóa. B5 hiện không có operation nhận bundle hoặc thực thi action mới. Vì vậy phương án PM “prepare mỗi lượt, giữ B5” đúng về recovery nhưng thiếu bootstrap transport.

Làm spike trước khi viết nhiều scenario: sau B5, Operator có thể đưa **đúng bundle đã duyệt** vào guest và cài quyền root bằng đường nào? Đề xuất đánh giá một kênh triển khai SSH riêng do Operator kiểm soát, credential quản trị guest nhập trực tiếp trong UI/operator setup, dùng transient nếu chưa có secret store đủ chuẩn. Browser chỉ gửi chọn scenario/approval, không gửi Bash, local path, host, port hoặc URL. Backend không mở SFTP hay arbitrary command API ra browser. Không nới tài khoản forced-command thành sudo bash tùy ý. Không dùng credential Windows Operator như thể đó là credential Ubuntu.

Chưa có chứng cứ một kênh bootstrap như vậy đã tồn tại. Phải qualification transfer, kiểm tra hash/target, cài root-owned files, dispatcher/sudoers, lỗi giữa chừng và lặp lại sau reset. Nếu còn phải nhập guest credential mỗi lượt thì ghi đúng hạn chế; đó chưa đạt mục tiêu one-click thường ngày. Nếu không chấp nhận sự phụ thuộc này, baseline V2 có bootstrap tối thiểu là quyết định thay đổi scope riêng, cần approval/checkpoint/backup qualification riêng; không âm thầm sửa B5.

Bundle trên host phải được bảo vệ khỏi Agent/learner sửa. Hash trong manifest cùng thư mục writable không đủ làm gốc tin cậy. Operator kiểm tra digest nằm trong approval/protected registry. Quyền sudo toàn phần của learner trong disposable guest có nghĩa guest verifier có thể bị sửa; không quảng cáo grading chống gian lận. Dùng client HTTP độc lập và quan sát nhiều lớp để hạn chế PASS do đổi output kiểm tra.

## Contract Scenario Pack tối thiểu

Mỗi entry có ID/revision/bundle digest, customer ticket trung tính, target profile, prerequisites, resource ownership, các action ID prepare/inject và checklist prepared/fault/grade. Thêm fixed website endpoint ID, giới hạn thời gian cho từng bước và learner deadline; recovery luôn tham chiếu chung B5 policy. Khởi đầu registry đóng trong protected release, chưa cần upload/plugin marketplace hay interpreter cho shell trong JSON.

Tách ba lớp: (1) invariants host/SSH/network/base page; (2) healthy environment của scenario sau prepare; (3) trạng thái lỗi/sau sửa. Ví dụ Nginx main config hash giữ nguyên không chứng minh conf.d không đổi; LAB-07 cần validate full effective config, file ownership và scenario expectations. Allow những thay đổi scenario đã định nghĩa, giữ check baseline chính; không tắt kiểm tra hash/firewall chung để có PASS.

Lifecycle: preflight B5 → claim/lease → journal prepare started → deploy/prepare → healthy scenario verification → journal inject started → inject → independent fault verification → learner → revoke terminal → grade → một B5 reset → baseline verification + scenario residue checks → finalize → release lease. Lease giữ xuyên cả prepare. Lỗi/timeout sau mutation đi đúng recovery đã duyệt. Operation ambiguous không replay; restart không tự chạy tiếp injection/reset. Thời gian làm bài bắt đầu khi ready/running, không ăn vào thời gian deploy. Không chạy cleanup từ source rồi thêm một recovery không ghi nhận.

Mỗi VM chỉ một scenario active. “Regression cùng tồn tại” ở đây là bundle/catalog cùng có mặt và chạy tuần tự trên VM, không phải inject nhiều bài đồng thời. Website API nhận endpoint ID thuộc selected run, resolve IP/port/path từ protected pack, không theo redirect tới target tùy ý; giới hạn body/time và escape preview như hiện tại.

## Ba bài port đầu tiên

| Bài | Prepare khỏe | Fault phải chứng minh | Grade chức năng và tránh sửa tắt |
|---|---|---|---|
| LAB-TLAB-002 | HTTP service non-root port 18080; index đúng bytes, mode/owner an toàn | Service còn active; file không đọc được bằng service identity; client nhận lỗi | Đúng service/process/endpoint/body; service đọc được file, quyền hợp lý; không đổi service chạy root hoặc chmod 777 để qua bài. Không bắt duy nhất một lệnh sửa. |
| LAB-TLAB-003 | Cùng Python service khỏe; reserved port rảnh trước prepare | Decoy sở hữu listener, trả sai body; intended app không phục vụ | Intended service sở hữu listener, HTTP đúng bytes, decoy không active; không chỉ viết body khỏe vào decoy. |
| LAB-TLAB-007 | Backend loopback 18082, frontend 18081 đúng upstream, main port 80 vẫn khỏe | Backend đúng 200; frontend đúng 502 từ Windows; SSH/network giữ nguyên | Frontend+backend đúng bytes/status, effective proxy config hợp lệ; không thay reverse proxy bằng trang static để qua. |

Đối với LAB-07, không đổi firewall ở vòng đầu nếu target đã cho phép endpoint. Nếu client bị chặn, coi prerequisite chưa đạt; chỉ bổ sung rule có phạm vi và approval sau khi kiểm chứng policy, không bật firewalld/flush nftables. Ghi nhận expected firewall delta cho run nếu thật sự cần.

## Thứ tự triển khai và điểm nghiệm thu

1. **M4 nền dùng chung:** lifecycle install/update/stop hiểu completed/active/unknown state; giữ DB/journal M3; browser Operator authentication + approval mới có TTL và scope; không tự giải khóa consumed admission. Chưa cần polished installer/updater hoàn chỉnh.
2. **Bootstrap spike và contract:** đóng gói cố định, capability probes chỉ đọc, deploy qualification riêng trên original sau approval. Chốt credential/persistence sau reset. Không đạt gate này thì chỉ phát triển adapter source/harness, chưa quảng cáo live-ready.
3. **Port LAB-02 một mình:** thêm registry/service prepare và API/UI chọn bài, bảo toàn LAB-WEB-001. Test success/fail/partial prepare/timeout/restart/no-retry bằng harness; actual một lượt có approval riêng, grade trước reset, baseline sạch.
4. **Port LAB-03 rồi LAB-07:** dùng cùng contract; actual từng bài riêng. Kiểm thử chuỗi 02 → reset → 03 → reset → 07 → reset và một lượt quay lại bài trước bằng approvals riêng. Không tự thực hiện chuỗi này chỉ dựa trên phê duyệt phân tích.
5. **M4 hoàn chỉnh:** installer, shortcut/service lifecycle, TLS/pairing/diagnostics, migration progress, upgrade/uninstall. Release đầu có LAB-WEB-001 cộng ba bài đã qualification; bài chưa đạt để unavailable rõ ràng.
6. **Mở rộng có chọn lọc:** 04/05/09 rồi 10/13/15; 11 khi sampling+backend checks ổn; 14 khi latency metric không chồng lấn và qua host-load qualification; 16 khi burst/stale-content verification ổn. LAB-01 dễ nhưng trùng kỹ năng service-down với bài hiện tại, nên ưu tiên thấp. 08/12 gate riêng; 06 ngoài scope V1.

Không cần thêm External Lab mode ngay: nó thêm navigation/progress semantics trong khi người dùng muốn làm hết trên web. Có thể nhập 16 customer tickets vào catalog riêng dưới trạng thái planned, nhưng chưa có Start thật và không tăng/sửa 112 original tickets. Root cause, setup script, expected repair không trả trong learner catalog.

Functional verification tách khỏi troubleshooting review. Note nên có triệu chứng/evidence, giả thuyết, nguyên nhân, thay đổi, xác minh; không suy ra chất lượng lập luận từ hệ thống đã khỏe và không bắt lưu transcript/password. M3 note ngắn là ví dụ cần UX tốt hơn, không phải lý do sửa grade lịch sử.

## Kiểm chứng và phạm vi công việc

Mỗi port phải có test từ chối unknown action/target/digest, idempotency và restart ambiguity, lease trong prepare, lỗi sau mutation, terminal revoke trước grade, failed grade vẫn failed sau reset, endpoint allowlist, permission/process/bypass negatives. Chạy unit/content/build và browser regression phù hợp; các harness không cấp qualification live. Actual evidence cần run/approval/revision/digest, prepared/fault/grade từng check, reset count, independent baseline, finalization, lease clear và protected VM/backup invariants.

Không ước lượng nhập 16 bài bằng số lượng file cần copy. Đường găng là bootstrap sau reset, reusable approval/lifecycle và actual qualification ba bài. Kết quả phân tích này chỉ tạo tài liệu; chưa thay runtime, chưa sửa thư mục nguồn HyperV_TicketLab, chưa chạy VM operations.
