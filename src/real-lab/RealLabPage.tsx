import { useState } from 'react'

type AgentState = 'unchecked' | 'unavailable' | 'foundation_only'

export function RealLabPage() {
  const [agent, setAgent] = useState<AgentState>('unchecked')
  const [error, setError] = useState('')

  async function checkAgent() {
    setError('')
    try {
      const response = await fetch('http://127.0.0.1:4174/api/v1/status', { method: 'GET', cache: 'no-store', signal: AbortSignal.timeout(3000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data: unknown = await response.json()
      if (!data || typeof data !== 'object' || !('phase' in data) || data.phase !== 'foundation_only') throw new Error('Unexpected agent response')
      setAgent('foundation_only')
    } catch (cause) {
      setAgent('unavailable')
      setError(cause instanceof Error ? cause.message : 'Không thể đọc trạng thái agent')
    }
  }

  return <section className="subpage real-lab-page">
    <div className="eyebrow"><span className="eyebrow-line" /> REAL LAB · PHASE 0</div>
    <h1>Real Lab</h1>
    <p>Môi trường thực đang được chuẩn bị. Bài học Guided và terminal mô phỏng hoạt động độc lập.</p>
    <div className="real-lab-status" role="status">
      <strong>Trạng thái môi trường: Chưa sẵn sàng</strong>
      <p>{agent === 'foundation_only' ? 'Local Lab Agent phản hồi, nhưng chưa xác minh VM, baseline hoặc khả năng khôi phục.' : agent === 'unavailable' ? 'Không kết nối được Local Lab Agent.' : 'Chưa kiểm tra Local Lab Agent. Chưa có VM nào được xác minh.'}</p>
      {error && <small>Chi tiết: {error}</small>}
      <button type="button" onClick={checkAgent}>Kiểm tra agent (chỉ đọc)</button>
    </div>
    <div className="real-lab-grid">
      <article><h2>Danh mục lab</h2><p><strong>LAB-WEB-001 · Nginx unavailable</strong> đang được kiểm thử bằng mock. Chưa có scenario được phê duyệt để chạy trên Ubuntu VM; ticket cũ không tự động chuyển thành lab.</p></article>
      <article><h2>Điều kiện để bắt đầu</h2><ul><li>VM disposable được chỉ định rõ và một controller sở hữu.</li><li>Preflight, backup và khôi phục qua host đạt kiểm chứng.</li><li>Scenario setup, fault check và grading được kiểm thử riêng.</li></ul></article>
    </div>
    <p className="real-lab-footnote">Phase 1A chỉ có dry-run qua mock agent. Không có nút Start Real Lab hoặc terminal SSH thực.</p>
  </section>
}
