import { chromium } from '@playwright/test'
import fs from 'node:fs'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5177/'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
fs.mkdirSync('screenshots/phase-d2-2', { recursive: true })
await page.goto(baseUrl)
await page.getByTitle('Thư viện lệnh', { exact: true }).click()
for (const [name, query] of [
  ['systemctl-status', 'systemctl status sshd'],
  ['ssh-vvv', 'ssh -vvv user@IP'],
  ['ip-addr', 'ip -br addr'],
  ['support-task', 'PANEL: backup task'],
]) {
  await page.getByRole('textbox', { name: 'Tìm lệnh', exact: true }).fill(query)
  await page.locator('.library-list button').first().click()
  await page.locator('.library-detail').screenshot({ path: `screenshots/phase-d2-2/${name}-1440.png` })
}
await page.setViewportSize({ width: 390, height: 844 })
await page.getByRole('textbox', { name: 'Tìm lệnh', exact: true }).fill('ssh -vvv user@IP')
await page.locator('.library-list button').first().click()
await page.locator('.library-detail').screenshot({ path: 'screenshots/phase-d2-2/ssh-vvv-390.png' })
await browser.close()
