import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import type { GuidedAnswerKey, GuidedCase, GuidedQuestion } from '../src/guided/types'

const cases = JSON.parse(await readFile('src/data/guided-public.json', 'utf8')) as GuidedCase[]
// One full learning path per topic, collectively covering L0–L3 and all contexts.
const representatives = ['VPS-01-001', 'VPS-01-008', 'VPS-02-006', 'VPS-03-001', 'VPS-03-003', 'VPS-04-007', 'VPS-04-008', 'VPS-05-007', 'VPS-06-001', 'VPS-07-005', 'VPS-08-003', 'VPS-08-008', 'VPS-09-007', 'VPS-10-004', 'VPS-10-005', 'VPS-10-006', 'VPS-11-001', 'VPS-12-004', 'VPS-13-006', 'VPS-14-008']

test('Command Library keeps empty stdout separate from the explanation', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Tìm ticket', { exact: true }).fill('VPS-01-001')
  await page.locator('[data-ticket-id="VPS-01-001"]').click()
  await page.locator('.guided-entry').getByRole('button').click()
  await page.locator('.guided-heading').getByRole('button', { name: 'Thư viện lệnh', exact: true }).click()
  await page.getByLabel('Tìm lệnh', { exact: true }).fill('systemctl start')
  await page.locator('.library-list button').filter({ hasText: 'sudo systemctl start SERVICE' }).click()
  await page.locator('.library-expanded summary').click()
  await expect(page.locator('.library-example')).toHaveCount(0)
  await expect(page.locator('.library-caption')).toContainText('stdout rỗng')
  await expect(page.locator('.library-detail')).toContainText('Thành công thường không in stdout')
  await expect(page.locator('.library-notes')).toContainText('cần quyền')
})

async function answer(page: Page, item: GuidedCase, question: GuidedQuestion) {
  const key = JSON.parse(await readFile(`public/guided-feedback/${item.id}/${question.id}.json`, 'utf8')) as GuidedAnswerKey
  const card = page.locator('.guided-question').filter({ has: page.getByRole('heading', { name: question.prompt, exact: true }) })
  if (question.kind === 'step_order') {
    for (let target = 0; target < key.correctIds.length; target++) {
      const label = question.options.find(option => option.id === key.correctIds[target])!.label
      let index = (await card.locator('.guided-order li').allTextContents()).findIndex(text => text.includes(label))
      while (index > target) { await card.getByRole('button', { name: `Đưa bước ${index + 1} lên`, exact: true }).click(); index-- }
    }
  } else for (const id of key.correctIds) await card.getByLabel(question.options.find(option => option.id === id)!.label, { exact: true }).check()
  await card.getByRole('button', { name: 'Kiểm tra câu trả lời', exact: true }).click()
  await expect(card.locator('.guided-feedback')).toContainText(key.explanation)
  await card.getByText('Giải thích từng lựa chọn', { exact: true }).click()
  for (const feedback of Object.values(key.optionFeedback)) await expect(card.locator('.guided-feedback')).toContainText(feedback)
}

for (const [index, id] of representatives.entries()) test(`Phase B full topic path ${id}`, async ({ page }) => {
  test.setTimeout(45000)
  const item = cases.find(entry => entry.id === id)!
  if (index % 3 === 0) await page.setViewportSize({ width: 390, height: 844 })
  const answerRequests: string[] = []
  page.on('request', request => { if (request.url().includes(`/guided-answers/${id}.json`)) answerRequests.push(request.url()) })
  await page.goto('/')
  await page.getByLabel('Tìm ticket', { exact: true }).fill(id)
  await page.locator(`[data-ticket-id="${id}"]`).click()
  await page.locator('.guided-entry').getByRole('button').click()
  await expect(page.locator('.customer-explanation')).toContainText(item.customerExplanation!)
  await page.getByText('Gợi ý', { exact: true }).click()
  await page.getByRole('button', { name: 'Mở gợi ý', exact: true }).click()
  await expect(page.locator('.guided-hints')).toContainText(JSON.parse(await readFile(`public/guided-hints/${id}.json`, 'utf8')).hints[0])
  await expect(page.getByRole('button', { name: 'Mở gợi ý tiếp', exact: true })).toBeDisabled()
  for (const stage of ['triage', 'investigate', 'interpret', 'decide', 'verify']) {
    for (const question of item.questions.filter(question => question.stage === stage && question.kind !== 'short_answer')) await answer(page, item, question)
    if (stage === 'investigate') {
      await expect(page.locator('.guided-terminal')).toHaveCount(1)
      await expect(page.locator('.terminal-explanation')).toHaveCount(0)
      const probes = item.probes.filter(probe => !probe.requiredState || probe.requiredState.includes('initial'))
      for (const probe of probes) {
        await page.getByLabel('Nhập lệnh hoặc tác vụ', { exact: true }).fill(probe.command)
        await page.getByRole('button', { name: 'Chạy kiểm tra', exact: true }).click()
        const entry = page.locator(`.terminal-entry[data-probe-id="${probe.id}"]`)
        await expect(entry.locator('pre')).toHaveText(probe.output)
        await expect(entry.locator('.terminal-explanation')).toContainText(probe.why!)
        await expect(entry.locator('.terminal-explanation')).toContainText(probe.meaning)
      }
      await page.getByRole('button', { name: 'Mở gợi ý tiếp', exact: true }).click()
      await expect(page.locator('.guided-hints li')).toHaveCount(2)
      await page.getByRole('button', { name: 'Mở gợi ý tiếp', exact: true }).click()
      await expect(page.locator('.guided-hints li')).toHaveCount(3)
      if (index === 0 || index === 4) {
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.screenshot({ path: `screenshots/phase-b-${id}.png`, fullPage: true })
      }
    }
    expect(answerRequests).toHaveLength(0)
    if (stage !== 'verify') await page.locator('.guided-footer').getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  }
  await page.getByLabel('Ghi chú cuối ticket', { exact: true }).fill('Đã đối chiếu triệu chứng với kết quả kiểm tra, ghi điều chưa xác định, quyền cần có và bước xác minh sau xử lý hoặc chuyển cấp.')
  await page.getByRole('button', { name: 'Hoàn thành và xem đáp án', exact: true }).click()
  const answerKey = JSON.parse(await readFile(`public/guided-answers/${id}.json`, 'utf8'))
  await expect(page.locator('.guided-model')).toContainText(answerKey.referenceNoteEn)
  await expect(page.locator('.guided-model')).not.toContainText(answerKey.production_warning)
  expect(answerRequests.length).toBeGreaterThan(0)
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('vps-ticket-simulator-progress-v5')!))
  expect(progress.guidedAttempts[0].score).toBe(progress.guidedAttempts[0].total)
  expect(progress.guidedAttempts[0].contentRevision).toBe('D1-2026-10-26')
  expect(progress.guidedDrafts[id].submitted).toBe(true)
  expect(progress.reviewAttempts).toHaveLength(0)
  if (id === 'VPS-04-008') {
    await page.reload()
    const retained = await page.evaluate(() => JSON.parse(localStorage.getItem('vps-ticket-simulator-progress-v5')!))
    expect(retained.guidedAttempts[0]).toEqual(progress.guidedAttempts[0])
    expect(retained.reviewAttempts).toHaveLength(0)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})
