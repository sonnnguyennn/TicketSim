import { chromium } from '@playwright/test'
import fs from 'node:fs'

const phase = process.argv[2] ?? 'before'
const port = process.argv[3] ?? '5179'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
fs.mkdirSync('screenshots/phase-d2-1', { recursive: true })
await page.goto(`http://127.0.0.1:${port}/`)
await page.getByTitle('Thư viện lệnh', { exact: true }).click()
for (const [name, query] of [['getent', 'getent passwd'], ['ss', 'ss -ltnp'], ['journalctl', 'journalctl -u sshd'], ['panel', 'target quota']]) {
  await page.getByRole('textbox', { name: 'Tìm lệnh', exact: true }).fill(query)
  await page.locator('.library-list button').first().click()
  const detail = page.locator('.library-detail')
  const details = detail.locator('details')
  if (await details.count()) await details.first().evaluate(element => { element.open = true })
  await detail.screenshot({ path: `screenshots/phase-d2-1/${phase}-${name}.png` })
}
if (phase === 'after') {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('textbox', { name: 'Tìm lệnh', exact: true }).fill('getent passwd')
  await page.locator('.library-list button').first().click()
  await page.locator('.library-detail summary').click()
  await page.locator('.library-detail').screenshot({ path: 'screenshots/phase-d2-1/after-getent-390.png' })
  await page.setViewportSize({ width: 1440, height: 900 })
}
await page.goto(`http://127.0.0.1:${port}/`)
await page.evaluate(() => {
  const key = 'vps-ticket-simulator-progress-v5'
  const progress = JSON.parse(localStorage.getItem(key))
  progress.guidedDrafts['VPS-01-001'] = { stage: 4, responses: {}, feedback: {}, commands: [], hintLevel: 0, note: 'Support note drafted after review of sshd state and TCP/22 listener.', submitted: true, contentRevision: 'D1-2026-10-26' }
  localStorage.setItem(key, JSON.stringify(progress))
})
await page.reload()
await page.getByRole('textbox', { name: 'Tìm ticket', exact: true }).fill('VPS-01-001')
await page.locator('[data-ticket-id="VPS-01-001"]').click()
await page.locator('.guided-entry').getByRole('button', { name: /Học ticket|Tiếp tục/ }).click()
await page.locator('.guided-model').waitFor()
await page.locator('.guided-result').screenshot({ path: `screenshots/phase-d2-1/${phase}-guided-summary.png` })
if (phase === 'after') {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.guided-result').screenshot({ path: 'screenshots/phase-d2-1/after-guided-summary-390.png' })
}
await browser.close()
