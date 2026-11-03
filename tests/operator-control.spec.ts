import { test,expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { RunControlJournal } from '../operator/runControl.mjs'
import { OperatorApprovalControl } from '../operator/approvalControl.mjs'
import { createOperatorControlServer } from '../operator/controlServer.mjs'

test('Operator reviews exact scope in a separate HTTPS browser session without starting a run',async({browser})=>{
  const journal=new RunControlJournal(':memory:')
  const control=new OperatorApprovalControl({journal,principal:'TEST\\Operator',pairingCode:'public-operator-ui-fixture',resolveRelease:scenarioId=>({qualified:true,scenarioId,revision:1,bundleSha256:'a'.repeat(64)}),inspectLegacy:()=>({stateClear:true,mutationAuthorized:false})})
  const server=createOperatorControlServer({control,tls:{cert:readFileSync('tests/fixtures/web-pilot-test.crt'),key:readFileSync('tests/fixtures/web-pilot-test.key')}})
  let context
  try{
    await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve))
    context=await browser.newContext({ignoreHTTPSErrors:true})
    const page=await context.newPage()
    await page.goto(`https://127.0.0.1:${server.address().port}/`)
    await page.getByLabel('Mã ghép đôi Operator').fill('public-operator-ui-fixture')
    await page.getByRole('button',{name:'Kết nối Operator'}).click()
    await expect(page.getByText('Đã xác thực Operator.',{exact:false})).toBeVisible()
    await page.getByRole('button',{name:'Xem phạm vi lượt mới'}).click()
    await expect(page.locator('#scope')).toContainText('2b9c2170-9a23-4d08-b82e-29929afa4c10')
    await expect(page.locator('#scope')).toContainText('e6d04330-142c-4397-8e0d-ddf5a9e69090')
    await expect(page.locator('#effects')).toContainText('index file mode to 000')
    await expect(page.getByRole('button',{name:'Phê duyệt đúng lượt này'})).toBeDisabled()
    await page.getByRole('checkbox').check()
    await page.getByRole('button',{name:'Phê duyệt đúng lượt này'}).click()
    await expect(page.locator('#message')).toContainText('Đã cấp approval')
    expect(journal.db.prepare('SELECT COUNT(*) n FROM control_grants').get().n).toBe(1)
    expect(journal.db.prepare('SELECT COUNT(*) n FROM control_attempts').get().n).toBe(0)
    const cookies=await context.cookies()
    expect(cookies.find(cookie=>cookie.name==='__Host-ticketsim-operator')).toMatchObject({secure:true,httpOnly:true,sameSite:'Strict'})
    expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0})
  }finally{
    await context?.close()
    await new Promise<void>(resolve=>server.close(()=>resolve()))
    journal.close()
  }
})
