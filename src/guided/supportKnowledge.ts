import type { CommandDoc, CommandKnowledge } from './types'

type TaskRow = [where: string, data: string[], authority: string, outcomes: string[], escalation: string]
// These are learning tasks, not GreenCloud button names or approved SOP steps.
const rows: Record<string, TaskRow> = {
  'panel-rebuild': ['Hệ thống quản lý VM được đội có quyền truy cập', ['VM ID', 'thời điểm reinstall', 'task ID và người yêu cầu'], 'Chỉ đọc với vai trò được cấp; không tự reinstall.', ['Có sự kiện reinstall', 'Không thấy sự kiện trong phạm vi truy vấn'], 'Chuyển VM owner/NOC nếu lịch sử và host key không khớp.'],
  'panel-ip-allocation': ['IPAM hoặc control plane của provider', ['VM ID', 'IPv4/CIDR', 'gateway', 'lịch sử thay đổi'], 'Chỉ nhân sự được cấp quyền IPAM; đổi IP cần change được duyệt.', ['Có allocation hiện hành', 'Allocation thiếu hoặc xung đột'], 'Chuyển network/IPAM khi allocation khác guest hoặc inventory.'],
  'panel-probes': ['Nguồn đo và network telemetry được phép dùng', ['source IP/region', 'destination IP/port', 'timestamp', 'kết quả từng probe'], 'Chỉ đọc theo quyền telemetry; capture mở rộng cần approval.', ['Success theo một nguồn', 'Timeout/loss theo nguồn khác'], 'Chuyển network/edge khi mất kết nối lặp lại và có cùng cửa sổ đo.'],
  'panel-backup-status': ['Inventory backup có quyền truy cập', ['artifact ID', 'VM/volume scope', 'timestamp UTC', 'verification/restore-test record'], 'Chỉ đọc; restore hoặc thử restore cần owner và runbook.', ['Có artifact được ghi nhận', 'Không có bản đã xác minh'], 'Chuyển backup/storage khi thiếu restore proof hoặc RPO không đạt.'],
  'panel-cert-inventory': ['Inventory certificate được phép truy cập', ['hostname', 'SAN', 'expiry', 'deployment target'], 'Chỉ đọc; cấp hoặc triển khai cert cần owner phê duyệt.', ['Có cert trong inventory', 'Thiếu cert cho hostname'], 'Chuyển certificate/owner khi inventory và TLS thực phục vụ khác nhau.'],
  'panel-rdns': ['IPAM hoặc rDNS control plane của IP owner', ['IP được cấp', 'PTR hiện tại', 'forward A', 'owner yêu cầu'], 'Đổi PTR chỉ khi owner và quyền IP đã xác nhận.', ['PTR được ghi nhận', 'PTR chưa cấu hình'], 'Chuyển IP owner/network khi không có quyền thao tác hoặc DNS không nhất quán.'],
  'registrar-change': ['Registrar của domain do chủ sở hữu kiểm soát', ['domain', 'NS cũ/mới', 'zone mới có dữ liệu', 'TTL', 'rollback plan'], 'Thay đổi delegation cần chủ domain phê duyệt và người có quyền registrar.', ['NS mới được ghi nhận tại registrar', 'Thay đổi chờ propagation'], 'Chuyển domain owner/DNS khi thiếu quyền hoặc zone mới chưa sẵn sàng.'],
  'storage-escalation': ['Hệ thống incident nội bộ của đội hạ tầng', ['VM/volume ID', 'I/O error', 'mount mode', 'timestamp', 'ảnh hưởng dữ liệu'], 'Support chỉ mở/escalate theo phạm vi quyền; host fix thuộc storage team.', ['Incident được tiếp nhận', 'Đang điều tra', 'Có quyết định xử lý'], 'Chuyển ngay storage/on-call nếu read-only, I/O errors hoặc nguy cơ mất dữ liệu.'],
  'panel-zone': ['DNS zone editor mà owner/provider cho phép', ['zone/domain', 'record name/type/value', 'NS authoritative', 'serial/TTL'], 'Chỉ đọc; đổi zone cần domain owner phê duyệt.', ['Zone có record mới', 'Zone chưa được publish'], 'Chuyển DNS owner nếu delegation hoặc authoritative answer không khớp.'],
  'panel-reinstall-confirmation': ['Màn hình xác nhận thao tác VM của provider', ['VM ID', 'disk bị ghi đè', 'backup/restore proof', 'owner approval'], 'Chỉ đọc cảnh báo; reinstall là thao tác destructive cần approval rõ.', ['Cảnh báo ghi đè disk chính', 'Không đủ dữ liệu xác định phạm vi'], 'Chuyển VM owner/NOC nếu không rõ disk scope hoặc backup.'],
  'panel-backup-task': ['Task monitor của backup platform', ['task ID', 'VM/volume', 'timestamp', 'target datastore/quota', 'artifact ID'], 'Chỉ đọc; xóa/đổi target cần backup owner duyệt.', ['Failed', 'Completed', 'Running'], 'Chuyển backup team khi failed hoặc completed nhưng artifact/restore proof thiếu.'],
  'backup-log': ['Log của backup platform theo task ID', ['task ID', 'timestamp UTC', 'target', 'error code', 'artifact'], 'Chỉ đọc log theo quyền; che secret/token trước khi chia sẻ.', ['Error target quota', 'Task không ghi lỗi trong đoạn đã xem'], 'Chuyển backup/storage khi lỗi ở target hoặc thiếu log có thể đối chiếu.'],
  'panel-restore-points': ['Inventory backup/snapshot', ['artifact ID', 'scope', 'mốc UTC', 'retention', 'restore-test result'], 'Chỉ đọc; restore production cần owner, change và rollback.', ['Có mốc completed', 'Không có mốc phù hợp RPO'], 'Chuyển backup owner khi không có artifact phù hợp hoặc restore proof.'],
  'panel-provision-task': ['Provisioning audit/queue của control plane', ['order ID', 'VM ID', 'image', 'resource', 'task history'], 'Chỉ đọc; xóa/recreate VM cần owner approval.', ['Completed', 'Failed', 'Duplicate task'], 'Chuyển provisioning/NOC khi task và VM inventory lệch.'],
  'panel-task-queue': ['Task queue của control plane', ['task ID', 'VM/order', 'lock owner', 'progress', 'worker state'], 'Chỉ đọc; force unlock/cancel cần SOP và owner.', ['Waiting lock', 'Running', 'Failed'], 'Chuyển control-plane owner khi lock lâu hoặc worker không tiến triển.'],
  'panel-api-audit': ['API gateway audit và permission matrix', ['request ID', 'token owner/scope', 'resource owner', 'HTTP status', 'timestamp'], 'Chỉ đọc; cấp scope cần xác minh owner và approval; không dùng admin token thay khách.', ['403 Forbidden', 'Request accepted theo scope'], 'Chuyển IAM/API owner khi matrix và audit không khớp.'],
  'billing-service': ['Billing/lifecycle record của dịch vụ', ['service ID', 'owner', 'invoice', 'suspension reason', 'audit trail'], 'Chỉ đọc; unsuspend hoặc xóa dịch vụ cần billing owner/SOP.', ['Active', 'Suspended', 'Pending cancellation'], 'Chuyển billing owner khi payment và service state lệch.'],
  'billing-invoice': ['Invoice và payment ledger', ['invoice ID', 'payment ID', 'settlement status', 'service ID'], 'Chỉ đọc; charge/refund cần billing approval và audit.', ['Overdue', 'Paid', 'Payment pending'], 'Chuyển billing khi ledger và payment evidence không khớp.'],
  'panel-lifecycle-policy': ['Policy/contract và service lifecycle record', ['service ID', 'policy version', 'retention', 'cancellation/refund request'], 'Chỉ đọc; eligibility và thay đổi cần owner/billing xác nhận.', ['End-of-term được hỗ trợ', 'Yêu cầu còn chờ'], 'Chuyển billing/legal/owner khi policy hoặc quyền dữ liệu chưa rõ.'],
  'panel-security-case': ['Security/abuse case management', ['case ID', 'hold reason', 'appeal', 'decision owner', 'audit timestamp'], 'Support chỉ đọc/escalate theo quyền; không tự override hold.', ['Investigation open', 'Appeal received', 'Decision recorded'], 'Chuyển security owner để quyết định containment/unsuspend.'],
}

export function supportKnowledge(card: CommandDoc): CommandKnowledge {
  const row = rows[card.id]
  if (!row) throw new Error(`No support task authored for ${card.id}`)
  const [where, dataToCheck, authority, observableOutcomes, escalation] = row
  return {
    kind: 'support_task',
    syntax: '',
    options: [],
    examples: [{ command: '', purpose: card.whenToUse, expectedOutput: card.exampleOutput, interpretation: card.interpretation, outputIsExcerpt: true, context: 'panel/support' }],
    proves: card.interpretation,
    doesNotProve: card.pitfalls,
    verification: 'INTERNAL_SOP_REQUIRED',
    sourceUrls: [],
    task: { where, dataToCheck, authority, observableOutcomes, limits: card.interpretation, escalation },
  }
}
