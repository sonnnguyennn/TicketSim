import type { SupportLevel } from './types'

const levels: { id: SupportLevel; title: string }[] = [
  { id: 'beginner', title: 'Beginner' },
  { id: 'normal', title: 'Normal' },
  { id: 'independent', title: 'Independent' },
]

export function SupportLevelSelector({ value, onChange }: { value: SupportLevel; onChange: (value: SupportLevel) => void }) {
  return <div className="support-level" role="group" aria-label="Mức hỗ trợ khi học">
    <span>Mức hỗ trợ</span>
    <div>{levels.map(level => <button type="button" key={level.id} aria-pressed={value === level.id} onClick={() => onChange(level.id)}>{level.title}</button>)}</div>
    <small>{value === 'beginner' ? 'Hiện lệnh gợi ý và rút gọn ghi chú.' : value === 'normal' ? 'Gợi ý theo độ khó; có thể mở khi cần.' : 'Tự nhập phép kiểm tra; ẩn gợi ý, vẫn tra được Command Library.'}</small>
  </div>
}
