import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`navigation and layout ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Kho ticket' })).toBeVisible()
    await expect(page.locator('[data-ticket-id]')).toHaveCount(112)
    await page.keyboard.press('Tab')
    expect(await page.locator(':focus').count()).toBe(1)
    await page.keyboard.press('Tab')
    await expect(page.getByTitle('Thư viện lệnh')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: /Thư viện lệnh/i })).toBeVisible()
    await page.getByTitle('Kho ticket').click()
    await page.getByTitle('Thư viện lệnh').click()
    await expect(page.getByRole('heading', { name: /Thư viện lệnh/i })).toBeVisible()
    await page.getByTitle('Kho ticket').click()
    await page.getByRole('button', { name: /Guided/i }).first().click()
    await expect(page.getByRole('navigation', { name: 'Các bước bài học' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    await page.screenshot({ path: `screenshots/guided-${viewport.width}.png`, fullPage: true })
  })
}

test('refresh and export/import preserve v5 progress', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Guided/i }).first().click()
  await page.locator('input[type="radio"]').first().check()
  await page.getByRole('button', { name: /Kho ticket/i }).first().click()
  await page.getByTitle('Cài đặt').click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Xuất tiến độ' }).click()
  const download = await downloadPromise
  const path = await download.path()
  expect(path).toBeTruthy()
  const saved = JSON.parse(await readFile(path!, 'utf8'))
  expect(saved.version).toBe(5)
  expect(Object.keys(saved.guidedDrafts).length).toBeGreaterThan(0)
  await page.evaluate(() => localStorage.removeItem('vps-ticket-simulator-progress-v5'))
  await page.reload()
  await page.getByTitle('Cài đặt').click()
  await page.locator('input[type="file"]').setInputFiles(path!)
  await expect(page.getByRole('status')).toContainText('Đã nhập tiến độ thành công')
  await page.reload()
  expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('vps-ticket-simulator-progress-v5')!).guidedDrafts).length)).toBeGreaterThan(0)
})

test('v1 snapshot migrates without erasing its original key', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => { localStorage.setItem('vps-ticket-simulator-progress-v1', JSON.stringify({ version: 1, drafts: {}, attempts: [] })); localStorage.removeItem('vps-ticket-simulator-progress-v5') })
  await page.reload()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('vps-ticket-simulator-progress-v5')!).version)).toBe(5)
  expect(await page.evaluate(() => localStorage.getItem('vps-ticket-simulator-progress-v1'))).not.toBeNull()
})

test('delayed alternate scenario grants Mastered only after independent answers', async ({ page }) => {
  const guided = JSON.parse(await readFile('src/data/guided-public.json', 'utf8'))
  const variant = guided.find((item: { id: string }) => item.id === 'VPS-01-001').reviewVariants[0]
  await page.goto('/')
  await page.evaluate(() => {
    const key = 'vps-ticket-simulator-progress-v5'
    const progress = JSON.parse(localStorage.getItem(key)!)
    progress.guidedAttempts.push({ id: 'browser-guided', ticketId: 'VPS-01-001', createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), responses: {}, commands: [], hintLevel: 0, note: 'Đã đối chiếu bằng chứng và xác minh.', score: 5, total: 6, independent: false, outcomes: {} })
    localStorage.setItem(key, JSON.stringify(progress))
  })
  await page.reload()
  await page.getByTitle('Review Mistakes').click()
  await page.getByRole('button', { name: 'Đánh giá biến thể' }).first().click()
  await expect(page.getByText(variant.scenario)).toBeVisible()
  for (const question of variant.questions) {
    const key = JSON.parse(await readFile(`public/review-feedback/VPS-01-001/${variant.id}/${question.id}.json`, 'utf8'))
    for (const id of key.correctIds) await page.getByLabel(question.options.find((option: { id: string }) => option.id === id).label, { exact: true }).check()
  }
  await page.getByRole('button', { name: 'Nộp bài ôn' }).click()
  await expect(page.getByText(`Đúng ${variant.questions.length}/${variant.questions.length}.`, { exact: false })).toBeVisible()
  await page.reload()
  await page.getByTitle('Review Mistakes').click()
  await expect(page.getByRole('article').filter({ hasText: 'VPS-01-001' })).toContainText('Mastered')
})

test('new L3 Guided case requires authored extra evidence before interpretation', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Tìm ticket' }).fill('VPS-05-007')
  await page.locator('[data-ticket-id="VPS-05-007"]').click()
  await page.getByRole('button', { name: /Guided/i }).first().click()
  await expect(page.getByText('EXT4-fs error on /dev/vda1')).toHaveCount(0)
  const key = JSON.parse(await readFile('public/guided-feedback/VPS-05-007/triage.json', 'utf8'))
  const guided = JSON.parse(await readFile('src/data/guided-public.json', 'utf8'))
  const item = guided.find((entry: { id: string }) => entry.id === 'VPS-05-007')
  await page.getByLabel(item.questions.find((question: { id: string }) => question.id === 'triage').options.find((option: { id: string }) => option.id === key.correctIds[0]).label).check()
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời' }).click()
  await page.getByRole('button', { name: /Tiếp tục/i }).click()
  const checkKey = JSON.parse(await readFile('public/guided-feedback/VPS-05-007/check.json', 'utf8'))
  await page.getByLabel(item.questions.find((question: { id: string }) => question.id === 'check').options.find((option: { id: string }) => option.id === checkKey.correctIds[0]).label).check()
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời' }).click()
  await page.getByRole('button', { name: /Chạy mô phỏng/i }).nth(0).click()
  await page.getByRole('button', { name: /Chạy mô phỏng/i }).nth(1).click()
  await expect(page.getByRole('button', { name: /Tiếp tục/i })).toBeDisabled()
  await page.getByRole('button', { name: /Chạy mô phỏng/i }).nth(2).click()
  await page.getByRole('button', { name: /Chạy mô phỏng/i }).nth(3).click()
  await expect(page.getByRole('button', { name: /Tiếp tục/i })).toBeEnabled()
})
