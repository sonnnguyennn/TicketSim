import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { mkdir } from 'node:fs/promises'
import type { GuidedAnswerKey, GuidedCase, GuidedQuestion } from '../src/guided/types'
import type { Progress } from '../src/types'

const STORAGE_KEY = 'vps-ticket-simulator-progress-v5'
const guidedCases = JSON.parse(await readFile('src/data/guided-public.json', 'utf8')) as GuidedCase[]
const caseFor = (id: string) => guidedCases.find(item => item.id === id)!
const initialProbes = (item: GuidedCase) => item.probes.filter(probe => !probe.requiredState || probe.requiredState.includes('initial'))
const next = (page: Page) => page.locator('.guided-footer').getByRole('button', { name: 'Tiếp tục', exact: true })
const stored = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY) as Promise<Progress>

test('Real Lab is separate, unavailable, and leaves Guided progress intact', async ({ page }) => {
  await page.goto('/')
  const before = await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)
  await page.getByTitle('Real Lab', { exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Real Lab', exact: true })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Chưa sẵn sàng')
  await expect(page.getByText('LAB-WEB-001', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: /Start Lab/i })).toHaveCount(0)
  await page.getByTitle('Kho ticket', { exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Kho ticket' })).toBeVisible()
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(before)
})

async function openTicket(page: Page, id: string) {
  await page.getByRole('textbox', { name: 'Tìm ticket', exact: true }).fill(id)
  await page.locator(`[data-ticket-id="${id}"]`).click()
  await page.locator('.guided-entry').getByRole('button', { name: /Học ticket|Tiếp tục/ }).click()
  await expect(page.getByRole('navigation', { name: 'Các bước bài học' })).toBeVisible()
}

async function answerQuestion(page: Page, item: GuidedCase, question: GuidedQuestion, wrong = false) {
  const key = JSON.parse(await readFile(`public/guided-feedback/${item.id}/${question.id}.json`, 'utf8')) as GuidedAnswerKey
  const card = page.locator('.guided-question').filter({ has: page.getByRole('heading', { name: question.prompt, exact: true }) })
  if (question.kind === 'step_order') {
    for (let target = 0; target < key.correctIds.length; target++) {
      const label = question.options.find(option => option.id === key.correctIds[target])!.label
      let index = (await card.locator('.guided-order li').allTextContents()).findIndex(text => text.includes(label))
      while (index > target) {
        await card.getByRole('button', { name: `Đưa bước ${index + 1} lên`, exact: true }).click()
        index--
      }
    }
  } else {
    const ids = wrong ? [question.options.find(option => !key.correctIds.includes(option.id))!.id] : key.correctIds
    for (const id of ids) await card.getByLabel(question.options.find(option => option.id === id)!.label, { exact: true }).check()
  }
  await card.getByRole('button', { name: 'Kiểm tra câu trả lời', exact: true }).click()
  await expect(card.locator('.guided-feedback')).toBeVisible()
  await expect(card.locator('.guided-feedback')).toContainText(key.explanation)
}

async function enterInvestigation(page: Page, id: string) {
  const item = caseFor(id)
  await openTicket(page, id)
  for (const question of item.questions.filter(question => question.stage === 'triage' && question.kind !== 'short_answer')) await answerQuestion(page, item, question)
  await next(page).click()
  await expect(page.locator('.guided-terminal')).toHaveCount(1)
  return item
}

async function run(page: Page, command: string) {
  const previous = await page.locator('.terminal-history .terminal-entry').count()
  await page.getByLabel('Nhập lệnh hoặc tác vụ', { exact: true }).fill(command)
  await page.getByRole('button', { name: 'Chạy kiểm tra', exact: true }).click()
  await expect(page.locator('.terminal-history .terminal-entry')).toHaveCount(previous + 1)
}

test('D2.1 library separates syntax, examples and support tasks without internal tags', async ({ page }) => {
  await page.goto('/')
  await page.getByTitle('Thư viện lệnh', { exact: true }).click()
  const search = page.getByRole('textbox', { name: 'Tìm lệnh', exact: true })
  await search.fill('BatchMode')
  await expect(page.locator('.library-list button').filter({ hasText: 'ssh -vvv' })).toBeVisible()
  await expect(page.locator('.library-options')).toContainText('BatchMode=yes')
  await expect(page.locator('.library-usage').filter({ hasText: 'BatchMode=yes' })).toHaveCount(1)
  await search.fill('target quota')
  await expect(page.locator('.library-detail')).toContainText('Nơi quan sát hoặc xử lý')
  await expect(page.locator('.library-detail')).toContainText('Quyền và chuyển cấp')
  await expect(page.locator('.library-detail h2 code')).toHaveCount(0)
  await expect(page.locator('.library-detail')).not.toContainText(/SOURCE_VERIFIED|PENDING|INTERNAL_SOP_REQUIRED/)
  await expect(page.locator('.library-detail')).not.toContainText('Flags và subcommands')
  await page.keyboard.press('Tab')
  expect(await page.locator(':focus').count()).toBe(1)
})

test('D3-B firewalld lookup distinguishes default zone from the zone handling traffic', async ({ page }) => {
  await page.goto('/')
  await page.getByTitle('Thư viện lệnh', { exact: true }).click()
  await page.getByRole('textbox', { name: 'Tìm lệnh', exact: true }).fill('firewall-cmd --list-all')
  await page.locator('.library-list button').filter({ hasText: 'firewall-cmd --list-all' }).click()
  const detail = page.locator('.library-detail')
  await expect(detail).toContainText('default zone')
  await expect(detail).toContainText('--get-active-zones')
  await expect(detail).toContainText('firewall-cmd --zone=public --list-all')
  await expect(detail).toContainText('interface/source')
})

test('D3-C2 card removes repeated command blocks but keeps examples and Quick Lookup', async ({ page }) => {
  await page.goto('/')
  await page.getByTitle('Thư viện lệnh', { exact: true }).click()
  await page.getByRole('textbox', { name: 'Tìm lệnh', exact: true }).fill('iostat -xz')
  const detail = page.locator('.library-detail')
  await expect(detail.locator('h2 code')).toHaveText('iostat -xz 1 5')
  await expect(detail.getByRole('heading', { name: 'Cú pháp' })).toHaveCount(0)
  await expect(detail.locator('.library-usage').first().locator('pre.library-syntax')).toHaveCount(0)
  await expect(detail).toContainText('iostat -yxz 1 3')
  await expect(detail).toContainText('Output mẫu — trích đoạn')
  await expect(detail).not.toContainText(/SOURCE_VERIFIED|LAB_PENDING|SOP_PENDING/)
})

test('D2.1 getent lookup distinguishes database, key, found and missing entry', async ({ page }) => {
  await page.goto('/')
  await page.getByTitle('Thư viện lệnh', { exact: true }).click()
  await page.getByRole('textbox', { name: 'Tìm lệnh', exact: true }).fill('getent passwd')
  const detail = page.locator('.library-detail')
  await expect(detail.locator('.library-options')).toContainText('Cơ sở dữ liệu passwd')
  await expect(detail.locator('.library-options')).toContainText('Đối số USER')
  await expect(detail).not.toContainText(/SOURCE_VERIFIED|PENDING|INTERNAL_SOP_REQUIRED|CentOS Stream 9/)
  await expect(detail).toContainText('getent passwd webapp')
  await expect(detail).toContainText('webapp:x:1001:1001')
  await expect(detail).toContainText('getent passwd admin')
  await expect(detail).toContainText('stdout rỗng · exit status 2')
  await expect(detail).not.toContainText('admin:x:1001:1001')
  await page.getByRole('textbox', { name: 'Tìm lệnh', exact: true }).fill('ss -ltnp')
  await expect(page.locator('.library-options code')).toHaveText(['-l', '-t', '-n', '-p'])
  await expect(page.locator('.library-options')).not.toContainText('ss -ltnp')
})

test('D2.2 feedback explains wrong, correct, missing and ordered choices at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const item = caseFor('VPS-01-001')
  await openTicket(page, item.id)
  await expect(page.locator('.guided-ticket p[lang="en"]')).toContainText('Hello Support Team')
  await expect(page.locator('.customer-explanation')).toHaveCount(0)
  await mkdir('screenshots/phase-d2-2', { recursive: true })
  await page.locator('.guided-ticket').screenshot({ path: 'screenshots/phase-d2-2/customer-English-390.png' })
  const triage = item.questions.find(question => question.id === 'triage')!
  await answerQuestion(page, item, triage, true)
  const triageCard = page.locator('.guided-question').filter({ has: page.getByRole('heading', { name: triage.prompt, exact: true }) })
  await expect(triageCard.locator('.guided-feedback')).toBeFocused()
  await expect(triageCard).toContainText('Bạn chọn sai')
  await expect(triageCard).toContainText('Đáp án đúng')
  await expect(triageCard).toContainText('Chưa đúng')
  await mkdir('screenshots/phase-d2-2', { recursive: true })
  await triageCard.screenshot({ path: 'screenshots/phase-d2-2/feedback-l0-wrong-390.png' })
  await next(page).click()
  for (const question of item.questions.filter(question => question.stage === 'investigate')) await answerQuestion(page, item, question)
  await run(page, item.probes.find(probe => probe.id === 'P1')!.command)
  await run(page, item.probes.find(probe => probe.id === 'P2')!.command)
  await next(page).click()
  await answerQuestion(page, item, item.questions.find(question => question.id === 'output')!)
  const evidence = item.questions.find(question => question.id === 'evidence')!
  const evidenceKey = JSON.parse(await readFile(`public/guided-feedback/${item.id}/evidence.json`, 'utf8')) as GuidedAnswerKey
  const evidenceCard = page.locator('.guided-question').filter({ has: page.getByRole('heading', { name: evidence.prompt, exact: true }) })
  for (const id of [evidenceKey.correctIds[0], evidence.options.find(option => !evidenceKey.correctIds.includes(option.id))!.id]) await evidenceCard.getByLabel(evidence.options.find(option => option.id === id)!.label, { exact: true }).check()
  await evidenceCard.getByRole('button', { name: 'Kiểm tra câu trả lời' }).click()
  await expect(evidenceCard.locator('.guided-feedback')).toBeFocused()
  for (const status of ['Bạn chọn đúng', 'Bạn chọn sai', 'Đáp án đúng', 'Không chọn']) await expect(evidenceCard).toContainText(status)
  await evidenceCard.screenshot({ path: 'screenshots/phase-d2-2/feedback-multi-390.png' })
  await next(page).click()
  await answerQuestion(page, item, item.questions.find(question => question.id === 'decision')!)
  const sequence = item.questions.find(question => question.id === 'sequence')!
  const sequenceCard = page.locator('.guided-question').filter({ has: page.getByRole('heading', { name: sequence.prompt, exact: true }) })
  await sequenceCard.getByRole('button', { name: 'Kiểm tra câu trả lời' }).click()
  await expect(sequenceCard.locator('.guided-feedback')).toBeFocused()
  await expect(sequenceCard).toContainText('Thứ tự bạn đã chọn')
  await expect(sequenceCard).toContainText('Thứ tự tham khảo')
  await expect(sequenceCard).toContainText('Sai vị trí')
  await sequenceCard.screenshot({ path: 'screenshots/phase-d2-2/feedback-order-390.png' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})

test('D2.2 quick lookup keeps the selected command and a relevant example visible', async ({ page }) => {
  await page.goto('/')
  await enterInvestigation(page, 'VPS-01-001')
  await page.locator('.quick-lookup > summary').click()
  const lookup = page.locator('.quick-lookup')
  await lookup.getByRole('textbox', { name: 'Tìm giải thích lệnh' }).fill('ss -ltnp')
  await expect(lookup.getByRole('heading', { name: 'Đang xem: ss -ltnp' })).toBeVisible()
  await expect(lookup.locator('.quick-results button[aria-current="true"]')).toContainText('ss -ltnp')
  await expect(lookup.locator('.quick-summary')).toContainText('Ví dụ:')
  await mkdir('screenshots/phase-d2-2', { recursive: true })
  await lookup.screenshot({ path: 'screenshots/phase-d2-2/quick-lookup-1440.png' })
  await lookup.getByRole('textbox', { name: 'Tìm giải thích lệnh' }).fill('journalctl')
  await expect(lookup.locator('.quick-results button[aria-current="true"]')).toBeVisible()
  await expect(lookup.locator('.quick-summary')).toContainText('journalctl')
})

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`Guided-first navigation, filters and terminal layout at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Kho ticket', exact: true })).toBeVisible()
    await expect(page.locator('[data-ticket-id]')).toHaveCount(112)
    await expect(page.locator('.guided-entry .primary-button')).toHaveCount(1)
    await expect(page.getByRole('button', { name: /^(Guided|Stateful|Objective Exam|Legacy Exam|Review Mistakes)$/ })).toHaveCount(0)
    await expect(page.getByRole('group', { name: 'Mức hỗ trợ khi học' })).toHaveCount(0)
    await expect(page.getByText(/VirtualBox|VM-snapshot mode|CentOS Stream 9 lab/)).toHaveCount(0)
    await page.getByRole('combobox', { name: 'Cấp độ', exact: true }).selectOption('3')
    await expect(page.locator('[data-ticket-id]')).toHaveCount(28)
    await page.getByRole('combobox', { name: 'Chủ đề', exact: true }).selectOption({ index: 1 })
    await expect(page.locator('[data-ticket-id]')).toHaveCount(2)
    await page.getByRole('combobox', { name: 'Trạng thái', exact: true }).selectOption('completed')
    await expect(page.locator('[data-ticket-id]')).toHaveCount(0)
    await page.getByRole('combobox', { name: 'Trạng thái', exact: true }).selectOption('all')
    await page.getByRole('combobox', { name: 'Chủ đề', exact: true }).selectOption('all')
    await page.getByRole('combobox', { name: 'Cấp độ', exact: true }).selectOption('all')
    await page.screenshot({ path: `screenshots/phase-a-list-${viewport.width}.png`, fullPage: true })
    await page.keyboard.press('Tab')
    expect(await page.locator(':focus').count()).toBe(1)
    await page.getByTitle('Thư viện lệnh', { exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'Kiến thức lệnh và tác vụ (122)' })).toBeVisible()
    await page.getByTitle('Kho ticket', { exact: true }).click()
    const item = await enterInvestigation(page, 'VPS-01-001')
    await run(page, initialProbes(item)[0].command)
    await run(page, initialProbes(item)[1].command)
    await expect(page.locator('.guided-terminal')).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    await page.screenshot({ path: `screenshots/phase-a-${viewport.width === 390 ? 'mobile' : 'desktop'}.png`, fullPage: true })
  })
}

test('SSH Guided keeps exact outputs, neutral errors, library return and grading through completion', async ({ page }) => {
  const item = caseFor('VPS-01-001')
  const answerRequests: string[] = []
  page.on('request', request => { if (request.url().includes('/guided-answers/VPS-01-001.json')) answerRequests.push(request.url()) })
  await page.goto('/')
  await openTicket(page, item.id)
  await answerQuestion(page, item, item.questions.find(question => question.stage === 'triage')!, true)
  await next(page).click()
  for (const question of item.questions.filter(question => question.stage === 'investigate')) await answerQuestion(page, item, question)
  await expect(next(page)).toBeDisabled()
  await run(page, 'sudo   systemctl status sshd')
  await expect(page.locator('.terminal-entry[data-probe-id="P1"] pre')).toHaveText(initialProbes(item)[0].output)
  await expect(page.locator('.terminal-entry[data-probe-id="P1"]')).toContainText(initialProbes(item)[0].meaning)
  await run(page, 'uname -a')
  await run(page, 'free -h')
  await run(page, 'sudo systemctl restart sshd')
  const entries = page.locator('.terminal-history .terminal-entry')
  for (const index of [1, 2, 3]) {
    await expect(entries.nth(index).locator('pre')).toHaveCount(0)
    await expect(entries.nth(index)).toContainText(/chưa|không|thay đổi/i)
  }
  await expect(next(page)).toBeDisabled()
  await run(page, 'ss -ltnp')
  await expect(next(page)).toBeEnabled()
  await page.getByLabel('Nhập lệnh hoặc tác vụ', { exact: true }).fill('journalctl -u sshd')
  const beforeLibrary = await stored(page)
  await page.locator('.guided-heading').getByRole('button', { name: 'Thư viện lệnh', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Kiến thức lệnh và tác vụ (122)' })).toBeVisible()
  await page.locator('.library-heading').getByRole('button', { name: /Quay lại/ }).click()
  await expect(page.getByLabel('Nhập lệnh hoặc tác vụ', { exact: true })).toHaveValue('journalctl -u sshd')
  expect((await stored(page)).guidedDrafts[item.id]).toEqual(beforeLibrary.guidedDrafts[item.id])
  await expect(entries).toHaveCount(5)
  expect(await page.locator('.terminal-history').evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
  await entries.first().scrollIntoViewIfNeeded()
  await expect(entries.first()).toBeInViewport()
  expect(answerRequests).toHaveLength(0)
  await next(page).click()
  await expect(page.locator('.guided-terminal')).toHaveCount(0)
  await expect(page.locator('.guided-reference pre:visible')).toHaveCount(0)
  for (const question of item.questions.filter(question => question.stage === 'interpret')) await answerQuestion(page, item, question)
  await next(page).click()
  for (const question of item.questions.filter(question => question.stage === 'decide')) await answerQuestion(page, item, question)
  await next(page).click()
  await expect(page.getByRole('textbox', { name: 'Ghi chú cuối ticket', exact: true })).toBeVisible()
  for (const question of item.questions.filter(question => question.stage === 'verify' && question.kind !== 'short_answer')) await answerQuestion(page, item, question)
  await page.getByRole('textbox', { name: 'Ghi chú cuối ticket', exact: true }).fill('SSH chưa chạy và chưa có listener cổng 22. Cần kiểm tra log, xin phép xử lý và xác minh kết nối từ client.')
  expect(answerRequests).toHaveLength(0)
  await page.getByRole('button', { name: 'Hoàn thành và xem đáp án', exact: true }).click()
  await expect(page.getByText('Reference ticket summary', { exact: true })).toBeVisible()
  await expect(page.locator('.guided-reference-fields')).toContainText('Findings')
  await expect(page.locator('.guided-reference-fields')).toContainText('inactive sshd')
  await expect(page.locator('.guided-model')).not.toContainText('Kiểm tra tiếp:')
  const result = await stored(page)
  expect(result.guidedAttempts).toHaveLength(1)
  expect(result.guidedAttempts[0].score).toBe(result.guidedAttempts[0].total - 1)
  expect(result.guidedAttempts[0].commands).toEqual(beforeLibrary.guidedDrafts[item.id].commands)
  expect(result.guidedAttempts[0].independent).toBe(false)
  expect(result.reviewAttempts).toHaveLength(0)
  expect(answerRequests.length).toBeGreaterThan(0)
  await page.reload()
  await openTicket(page, item.id)
  await expect(page.getByText('Reference ticket summary', { exact: true })).toBeVisible()
  await page.getByTitle('Lịch sử', { exact: true }).click()
  await expect(page.locator('.history-card')).toHaveCount(1)
  await expect(page.locator('.history-card')).toContainText(item.id)
})

test('a pre-D1 draft is preserved until the learner explicitly starts the revised case', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(key => {
    const progress = JSON.parse(localStorage.getItem(key)!)
    progress.guidedDrafts['VPS-02-006'] = { stage: 1, responses: { triage: ['symptom'] }, feedback: {}, commands: [], hintLevel: 0, note: 'Old draft', submitted: false }
    localStorage.setItem(key, JSON.stringify(progress))
  }, STORAGE_KEY)
  await page.reload()
  await page.getByRole('textbox', { name: 'Tìm ticket', exact: true }).fill('VPS-02-006')
  await page.locator('[data-ticket-id="VPS-02-006"]').click()
  await page.locator('.guided-entry').getByRole('button', { name: /Học ticket|Tiếp tục/ }).click()
  await expect(page.getByRole('heading', { name: 'Nội dung ticket đã được sửa' })).toBeVisible()
  expect((await stored(page)).guidedDrafts['VPS-02-006'].note).toBe('Old draft')
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Bắt đầu bản mới' }).click()
  await expect(page.getByRole('navigation', { name: 'Các bước bài học' })).toBeVisible()
  expect((await stored(page)).guidedDrafts['VPS-02-006'].note).toBe('')
})

test('D3-C2 asks to restart only a semantically changed draft and preserves its saved data', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(key => {
    const progress = JSON.parse(localStorage.getItem(key)!)
    progress.guidedDrafts['VPS-14-006'] = { stage: 1, responses: {}, feedback: {}, commands: [], hintLevel: 0, note: 'Historical retention draft', submitted: false, contentRevision: 'D1-2026-10-26' }
    progress.guidedAttempts.unshift({ id: 'historical-14', ticketId: 'VPS-14-006', createdAt: '2026-10-22T10:00:00Z', responses: {}, commands: [], hintLevel: 0, note: 'Historical attempt', score: 2, total: 6, independent: false, outcomes: {}, contentRevision: 'D1-2026-10-26' })
    localStorage.setItem(key, JSON.stringify(progress))
  }, STORAGE_KEY)
  await page.reload()
  await page.getByRole('textbox', { name: 'Tìm ticket', exact: true }).fill('VPS-14-006')
  await page.locator('[data-ticket-id="VPS-14-006"]').click()
  await page.locator('.guided-entry').getByRole('button', { name: /Học ticket|Tiếp tục/ }).click()
  await expect(page.getByRole('heading', { name: 'Nội dung ticket đã được sửa' })).toBeVisible()
  expect((await stored(page)).guidedDrafts['VPS-14-006'].note).toBe('Historical retention draft')
  expect((await stored(page)).guidedAttempts[0].score).toBe(2)
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Bắt đầu bản mới' }).click()
  expect((await stored(page)).guidedDrafts['VPS-14-006'].contentRevision).toBe('D3-C2-2026-10-26')
  expect((await stored(page)).guidedAttempts[0].score).toBe(2)
})

test('stored command history and independent setting survive Guided continuation, ticket changes and refresh', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(key => {
    const progress = JSON.parse(localStorage.getItem(key)!)
    progress.supportLevel = 'independent'
    progress.guidedDrafts['VPS-01-001'] = { stage: 1, responses: {}, feedback: {}, commands: [{ id: 'old-command', command: 'old investigation', output: 'output preserved from saved session', supported: true, kind: 'terminal', at: '2026-10-20T00:00:00Z' }], hintLevel: 0, note: 'Ghi chú đang soạn cần giữ lại.', submitted: false, contentRevision: 'D1-2026-10-26' }
    progress.statefulDrafts['VPS-01-001'] = { state: 'initial', commands: [], approval: false, note: 'Stateful draft retained', completed: false, errors: [] }
    progress.objectiveExamDrafts['VPS-01-001'] = { commands: [], responses: { triage: ['refused'] } }
    progress.examDrafts['VPS-01-001'] = { form: { symptom: 'Legacy Exam draft retained', hypothesis: '', evidence: '', action: '', verification: '' }, commands: [] }
    localStorage.setItem(key, JSON.stringify(progress))
  }, STORAGE_KEY)
  await page.reload()
  const before = await stored(page)
  await openTicket(page, 'VPS-01-001')
  await expect(page.locator('.guided-terminal')).toBeVisible()
  await expect(page.getByRole('group', { name: 'Mức hỗ trợ khi học' })).toHaveCount(0)
  await expect(page.getByText('Lệnh và tác vụ gợi ý', { exact: true })).toBeVisible()
  await expect(page.locator('.terminal-entry pre')).toHaveText('output preserved from saved session')
  await run(page, 'systemctl status sshd')
  await page.getByLabel('Nhập lệnh hoặc tác vụ', { exact: true }).fill('journalctl -u sshd -n 50 --no-pager')
  await page.getByRole('button', { name: 'Kho ticket', exact: true }).click()
  await openTicket(page, 'VPS-02-001')
  await page.getByRole('button', { name: 'Kho ticket', exact: true }).click()
  await openTicket(page, 'VPS-01-001')
  await expect(page.locator('.terminal-history .terminal-entry')).toHaveCount(2)
  await expect(page.getByLabel('Nhập lệnh hoặc tác vụ', { exact: true })).toHaveValue('journalctl -u sshd -n 50 --no-pager')
  await page.reload()
  await openTicket(page, 'VPS-01-001')
  await expect(page.locator('.terminal-history .terminal-entry')).toHaveCount(2)
  await expect(page.getByLabel('Nhập lệnh hoặc tác vụ', { exact: true })).toHaveValue('journalctl -u sshd -n 50 --no-pager')
  const after = await stored(page)
  expect(after.supportLevel).toBe('independent')
  expect(after.guidedDrafts['VPS-01-001'].stage).toBe(1)
  expect(after.guidedDrafts['VPS-01-001'].commands[0]).toEqual(before.guidedDrafts['VPS-01-001'].commands[0])
  expect(after.guidedDrafts['VPS-01-001'].note).toBe(before.guidedDrafts['VPS-01-001'].note)
  for (const field of ['statefulDrafts', 'objectiveExamDrafts', 'examDrafts'] as const) expect(after[field]).toEqual(before[field])
})

test('late question feedback cannot repopulate a restarted Guided draft', async ({ page }) => {
  let release!: () => void
  let arrived!: () => void
  const held = new Promise<void>(resolve => { release = resolve })
  const pendingRequest = new Promise<void>(resolve => { arrived = resolve })
  await page.route('**/guided-feedback/VPS-01-001/triage.json', async route => {
    arrived()
    await held
    await route.continue()
  })
  await page.goto('/')
  await openTicket(page, 'VPS-01-001')
  const question = caseFor('VPS-01-001').questions.find(question => question.stage === 'triage')!
  await page.getByLabel(question.options[0].label, { exact: true }).check()
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời', exact: true }).click()
  await pendingRequest
  await page.getByText('Tùy chọn bài học', { exact: true }).click()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Làm lại bài này', exact: true }).click()
  const responsePromise = page.waitForResponse(response => response.url().includes('/guided-feedback/VPS-01-001/triage.json'))
  release()
  await (await responsePromise).finished()
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const draft = (await stored(page)).guidedDrafts['VPS-01-001']
  expect(draft.responses).toEqual({})
  expect(draft.feedback).toEqual({})
  expect(draft.hintLevel).toBe(0)
  await expect(page.locator('.guided-feedback')).toHaveCount(0)
})

test('v5 export and import preserve all hidden mode data and Guided history exactly', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(key => {
    const p = JSON.parse(localStorage.getItem(key)!)
    const id = 'VPS-01-001', at = '2026-10-20T00:00:00Z'
    const command = { id: 'saved-command', command: 'systemctl status sshd', output: 'Active: inactive (dead)', supported: true, kind: 'terminal', probeId: 'P1', at }
    const form = { issue: 'SSH refused', hypothesis: 'Check service', evidence: 'inactive', nextCheck: 'ss -ltnp', action: 'Ask approval', verification: 'Client connection', escalation: 'If unresolved' }
    const checks = { symptom_identification: true, evidence_reasoning: true, additional_checks: false, safe_resolution: true, verification_or_escalation: false }
    const examForm = { symptom: 'SSH refused', hypothesis: 'Service', evidence: 'inactive', action: 'Ask approval', verification: 'Client connection' }
    const error = { category: 'missing_evidence', detail: 'Need listener evidence', at }
    p.supportLevel = 'independent'
    p.drafts[id] = { form, commands: [command], hintViewed: true, answerRevealed: true, checks }
    p.attempts = [{ id: 'practice', ticketId: id, createdAt: at, form, commands: [command], hintViewed: true, selfScore: 7, checks }]
    p.guidedDrafts[id] = { stage: 1, responses: { triage: ['refused'] }, feedback: { triage: { correct: true, correctIds: ['refused'], explanation: 'TCP refused', optionFeedback: { refused: 'No listener' } } }, commands: [command], commandInput: 'ss -ltnp', hintLevel: 1, note: 'A saved Guided note.', submitted: false }
    p.guidedAttempts = [{ id: 'guided', ticketId: id, createdAt: at, responses: {}, commands: [command], hintLevel: 1, note: 'Completed Guided note.', score: 5, total: 6, independent: false, outcomes: { output: false } }]
    p.reviewAttempts = [{ id: 'review', ticketId: id, createdAt: at, sourceAttemptId: 'guided', questionIds: ['output'], responses: { output: ['stopped'] }, outcomes: { output: true }, kind: 'mistakes' }]
    p.examDrafts[id] = { form: examForm, commands: [command], submittedAttemptId: 'exam' }
    p.examAttempts = [{ id: 'exam', ticketId: id, createdAt: at, form: examForm, commands: [command], checks, selfScore: 7 }]
    p.statefulDrafts[id] = { state: 'initial', commands: [command], approval: false, note: 'Saved Stateful note', completed: false, errors: [error] }
    p.statefulAttempts = [{ id: 'stateful', ticketId: id, createdAt: at, state: 'initial', commands: [command], note: 'Saved Stateful attempt', errors: [error] }]
    p.objectiveExamDrafts[id] = { responses: { triage: ['refused'] }, commands: [command], submittedAttemptId: 'objective' }
    p.objectiveExamAttempts = [{ id: 'objective', ticketId: id, createdAt: at, responses: { triage: ['refused'] }, commands: [command], outcomes: { triage: true }, score: 1, total: 6, errors: [error] }]
    localStorage.setItem(key, JSON.stringify(p))
  }, STORAGE_KEY)
  await page.reload()
  const before = await stored(page)
  await page.getByTitle('Lịch sử', { exact: true }).click()
  await expect(page.locator('.history-card')).toHaveCount(1)
  await page.getByTitle('Cài đặt', { exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Xuất tiến độ', exact: true }).click()
  const download = await downloadPromise
  const path = await download.path()
  expect(path).toBeTruthy()
  expect(JSON.parse(await readFile(path!, 'utf8'))).toEqual(before)
  await page.evaluate(key => localStorage.removeItem(key), STORAGE_KEY)
  await page.reload()
  await page.getByTitle('Cài đặt', { exact: true }).click()
  await page.locator('input[type="file"]').setInputFiles(path!)
  await expect(page.getByRole('status')).toContainText(/Đã nhập/)
  await page.reload()
  expect(await stored(page)).toEqual(before)
})

for (const version of [1, 2, 3, 4]) {
  test(`v${version} migration retains the original snapshot`, async ({ page }) => {
    await page.goto('/')
    const snapshot = { version, drafts: {}, attempts: [], ...(version >= 2 ? { guidedDrafts: { 'VPS-01-001': { stage: 1, responses: {}, feedback: {}, commands: [], hintLevel: 0, note: 'Saved migration note', submitted: false } }, guidedAttempts: [] } : {}), ...(version >= 3 ? { reviewAttempts: [] } : {}), ...(version >= 4 ? { examDrafts: {}, examAttempts: [] } : {}) }
    await page.evaluate(({ version, snapshot, key }) => { localStorage.setItem(`vps-ticket-simulator-progress-v${version}`, JSON.stringify(snapshot)); localStorage.removeItem(key) }, { version, snapshot, key: STORAGE_KEY })
    await page.reload()
    expect((await stored(page)).version).toBe(5)
    if (version >= 2) expect((await stored(page)).guidedDrafts['VPS-01-001'].note).toBe('Saved migration note')
    expect(await page.evaluate(version => JSON.parse(localStorage.getItem(`vps-ticket-simulator-progress-v${version}`)!), version)).toEqual(snapshot)
  })
}

for (const id of ['VPS-05-007', 'VPS-09-007', 'VPS-11-008', 'VPS-14-008']) {
  test(`${id} still requires every advanced investigation before interpretation`, async ({ page }) => {
    await page.goto('/')
    const item = await enterInvestigation(page, id)
    const outputQuestion = item.questions.find(question => question.id === 'output')!
    await expect(page.getByRole('heading', { name: outputQuestion.prompt, exact: true })).toHaveCount(0)
    for (const question of item.questions.filter(question => question.stage === 'investigate')) await answerQuestion(page, item, question)
    const probes = initialProbes(item)
    expect(probes).toHaveLength(4)
    for (const probe of probes.slice(0, -1)) {
      await run(page, probe.command)
      await expect(next(page)).toBeDisabled()
    }
    await run(page, probes.at(-1)!.command)
    await expect(next(page)).toBeEnabled()
    await next(page).click()
    await expect(page.getByRole('heading', { name: outputQuestion.prompt, exact: true })).toBeVisible()
    await expect(page.getByText('Reference ticket summary', { exact: true })).toHaveCount(0)
  })
}

test('web override retains authored stdout without source editorial notes at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const item = await enterInvestigation(page, 'VPS-07-003')
  const probe = initialProbes(item)[1]
  await run(page, probe.command)
  await expect(page.locator(`.terminal-entry[data-probe-id="${probe.id}"] pre`)).toHaveText(probe.output)
  await expect(page.locator('pre').filter({ hasText: 'root /var/www/html;' })).toBeVisible()
  await expect(page.getByText('intended deploy', { exact: false })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
})

test('Hypervisor investigation stays distinct from Guest and preserves literal output', async ({ page }) => {
  await page.goto('/')
  const item = await enterInvestigation(page, 'VPS-10-005')
  const probe = initialProbes(item)[1]
  await run(page, probe.command)
  const entry = page.locator(`.terminal-entry[data-probe-id="${probe.id}"]`)
  await expect(entry).toContainText('Hypervisor')
  await expect(entry.locator('pre')).toHaveText(probe.output)
  await expect(entry.locator('pre')).not.toContainText('(no vdb)')
})

for (const [id, task] of [['VPS-11-001', 'BACKUP LOG:'], ['VPS-12-001', 'PANEL: provisioning task'], ['VPS-14-001', 'BILLING: service']]) {
  test(`${task} uses the shared terminal history with Panel context`, async ({ page }) => {
    await page.goto('/')
    const item = await enterInvestigation(page, id)
    const probe = initialProbes(item).find(probe => probe.command === task)!
    await run(page, task)
    const entry = page.locator(`.terminal-entry[data-probe-id="${probe.id}"]`)
    await expect(entry).toContainText('Panel')
    await expect(entry).toContainText(task)
    await expect(entry.locator('pre')).toHaveText(probe.output)
    await expect(page.locator('.guided-terminal')).toHaveCount(1)
  })
}

test('empty stdout stays empty and suggestions fill the single input before execution', async ({ page }) => {
  await page.goto('/')
  const item = await enterInvestigation(page, 'VPS-13-002')
  const probe = initialProbes(item).find(probe => probe.output === '')!
  if (await page.locator('.terminal-suggestions').getAttribute('open') === null) await page.getByText('Lệnh và tác vụ gợi ý', { exact: true }).click()
  await page.getByRole('button', { name: `Chọn ${probe.command}`, exact: true }).click()
  await expect(page.getByLabel('Nhập lệnh hoặc tác vụ', { exact: true })).toHaveValue(probe.command)
  await expect(page.locator('.terminal-history .terminal-entry')).toHaveCount(0)
  await page.getByRole('button', { name: 'Chạy kiểm tra', exact: true }).click()
  const entry = page.locator(`.terminal-entry[data-probe-id="${probe.id}"]`)
  await expect(entry.locator('pre')).toHaveText('')
  await expect(entry).toContainText(/không có output|không có nội dung|không trả nội dung/i)
  expect((await stored(page)).guidedDrafts[item.id].commands[0].output).toBe('')
})
