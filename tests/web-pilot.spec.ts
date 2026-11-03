import { test, expect } from '@playwright/test'
import { spawn, type ChildProcess } from 'node:child_process'
import https from 'node:https'
import { readFileSync } from 'node:fs'
import { once } from 'node:events'

test.describe('isolated HTTPS web pilot integration (not actual VM qualification)', () => {
  let child: ChildProcess
  test.beforeAll(async () => {
    child = spawn(process.execPath, ['tests/fixtures/web-pilot-harness.mjs'], { windowsHide: true, stdio: 'ignore' })
    const ca = readFileSync('tests/fixtures/web-pilot-test.crt')
    for (let tries = 0; tries < 100; tries++) {
      const ready = await new Promise<boolean>(resolve => {
        const req = https.get('https://127.0.0.1:4188/api/v1/status', { ca }, response => { response.resume(); resolve(response.statusCode === 200) })
        req.on('error', () => resolve(false))
      })
      if (ready) return
      if (child.exitCode !== null) throw new Error('Browser harness exited')
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error('Browser harness not ready')
  })
  test.afterAll(async () => { if (child && child.exitCode === null) { const stopped = once(child, 'exit'); child.kill(); await stopped } })
  test('browser terminal, website test, note autosave/refresh and async submit preserve Guided data', async ({ browser }) => {
    test.setTimeout(60_000)
    const context = await browser.newContext({ ignoreHTTPSErrors: true })
    const page = await context.newPage()
    await page.goto('https://127.0.0.1:4188/#pair=browser-fixture-pair')
    await expect(page.getByRole('heading', { name: 'Môi trường lab', exact: true })).toBeVisible()
    expect(page.url()).not.toContain('pair=')
    await page.evaluate(() => localStorage.setItem('web-pilot-guided-sentinel', 'preserve-me'))
    await page.getByRole('button', { name: 'Kiểm tra môi trường', exact: true }).click()
    await expect(page.getByText('Preflight:', { exact: false }).first()).toContainText('PASS')
    await page.getByLabel('Mật khẩu SSH của tài khoản lab', { exact: true }).fill('browser-fixture-password')
    await page.getByRole('button', { name: 'Mở terminal', exact: true }).click()
    await expect(page.locator('.live-terminal-toolbar')).toContainText('Đã kết nối')
    await page.locator('.live-terminal-screen').scrollIntoViewIfNeeded()
    await expect(page.locator('.xterm-accessibility-tree')).toContainText('Tiếng Việt')
    await page.locator('.xterm-helper-textarea').pressSequentially('readonly fixture')
    await expect(page.locator('.xterm-accessibility-tree')).toContainText('readonly fixture')
    await page.reload()
    await expect(page.locator('.live-terminal-toolbar')).toContainText('Đã kết nối')
    await page.locator('.live-terminal-screen').scrollIntoViewIfNeeded()
    await expect(page.locator('.xterm-accessibility-tree')).toContainText('readonly fixture')
    await page.getByRole('button', { name: 'Kiểm tra HTTP', exact: true }).click()
    await expect(page.getByText('Nội dung mẫu:', { exact: false })).toContainText('Khớp')
    await page.getByRole('button', { name: 'Bắt đầu lab', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Đang làm bài', exact: true })).toBeVisible()
    await page.getByLabel('Mật khẩu SSH của tài khoản lab', { exact: true }).fill('browser-fixture-password')
    await page.getByRole('button', { name: 'Mở terminal', exact: true }).click()
    await expect(page.locator('.live-terminal-toolbar')).toContainText('Đã kết nối')
    await page.getByLabel('Bằng chứng kiểm tra của bạn', { exact: true }).fill('Browser fixture verification note')
    await expect(page.getByText('Đã lưu ghi chú', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Bằng chứng kiểm tra của bạn', { exact: true })).toHaveValue('Browser fixture verification note')
    await expect(page.locator('.live-terminal-toolbar')).toContainText('Đã kết nối')
    await page.screenshot({ path: 'screenshots/web-pilot-browser-harness-terminal.png', fullPage: true })
    await page.getByRole('button', { name: 'Nộp và kiểm tra', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Hoàn tất', exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.live-terminal')).toHaveCount(0)
    await expect(page.getByText('Kết quả bài:', { exact: false })).toContainText('PASS')
    await expect(page.getByText('Baseline sau reset:', { exact: false })).toContainText('PASS')
    expect(await page.evaluate(() => localStorage.getItem('web-pilot-guided-sentinel'))).toBe('preserve-me')
    expect(await page.evaluate(() => JSON.stringify({ local: localStorage, session: sessionStorage }))).not.toContain('browser-fixture-password')
    await page.screenshot({ path: 'screenshots/web-pilot-browser-harness-result.png', fullPage: true })
    await context.close()
  })
})
