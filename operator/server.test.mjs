import { afterEach, expect, it } from 'vitest'
import { createOperatorServer, OperatorJournal } from './server.mjs'
import { LIVE_TARGET } from '../agent/livePolicy.mjs'

const checkpointId='00000000-0000-4000-8000-000000000002'
const approval={ scenarioId:'LAB-WEB-001',vmId:LIVE_TARGET.vmId,checkpointId,b5Status:'PASS',firstTrialApproved:true,resetApproved:true,approvalId:'first-trial-0001',baselineHashes:{sshConfig:'a'.repeat(64),firewall:'b'.repeat(64)},b5Evidence:{status:'PASS',vmId:LIVE_TARGET.vmId,appliedCheckpointId:checkpointId,markerAbsent:true,sshAuthenticated:true,http200Exact:true,pageSha256:LIVE_TARGET.pageSha256,backupVhdSha256:LIVE_TARGET.backupVhdSha256,noOtherVmChanged:true,finalState:'Running',sshConfigSha256:'a'.repeat(64),firewallSha256:'b'.repeat(64)}}
let server, journal
afterEach(async()=>{if(server) await new Promise(resolve=>server.close(resolve)); if(journal) journal.close();server=null;journal=null})

it('finalizes only after a successful recorded reset and retains single-use approval/action evidence',()=>{
  journal=new OperatorJournal(':memory:')
  const runId='00000000-0000-4000-8000-000000000003'
  journal.claim(approval.approvalId,runId)
  expect(()=>journal.finalize(approval.approvalId,runId)).toThrow('RESET_NOT_VERIFIED')
  const actionId=journal.reserve(approval.approvalId,runId,'real-host-reset-v1')
  expect(()=>journal.finalize(approval.approvalId,runId)).toThrow('RESET_NOT_VERIFIED')
  journal.finish(actionId,'pass');journal.finalize(approval.approvalId,runId)
  const finished=journal.db.prepare('SELECT finalized_at FROM approvals').get().finalized_at
  journal.finalize(approval.approvalId,runId)
  expect(journal.db.prepare('SELECT finalized_at FROM approvals').get().finalized_at).toBe(finished)
  expect(()=>journal.reserve(approval.approvalId,runId,'real-host-reset-v1')).toThrow('OPERATION_ALREADY_ATTEMPTED')
  expect(()=>journal.claim(approval.approvalId,'00000000-0000-4000-8000-000000000004')).toThrow('APPROVAL_ALREADY_USED')
})

it('terminal-only operator accepts actual baseline proof with false trial flags but refuses claim and reset',async()=>{
  journal=new OperatorJournal(':memory:')
  const calls=[]
  server=createOperatorServer({approval:{...approval,firstTrialApproved:false,resetApproved:false},readOnly:true,token:'t'.repeat(40),journal,runner:async op=>{calls.push(op);return {targetVmId:LIVE_TARGET.vmId,checkpointId}}})
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  const request=operationId=>fetch(`http://127.0.0.1:${server.address().port}/v1/action`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${'t'.repeat(40)}`},body:JSON.stringify({operationId,approvalId:approval.approvalId,runId:operationId==='real-host-inspect-v1'?null:'00000000-0000-4000-8000-000000000003'})})
  expect((await request('real-host-inspect-v1')).status).toBe(200)
  expect((await request('real-host-claim-v1')).status).toBe(409)
  expect((await request('real-host-reset-v1')).status).toBe(409)
  expect(calls).toEqual(['real-host-inspect-v1'])
  expect(journal.db.prepare('SELECT count(*) AS n FROM approvals').get().n).toBe(0)
  expect(journal.db.prepare('SELECT count(*) AS n FROM actions').get().n).toBe(0)
})

it('authorizes only fixed host actions and refuses retry after a reset attempt', async()=>{
  journal=new OperatorJournal(':memory:')
  const calls=[]
  server=createOperatorServer({approval,token:'t'.repeat(40),journal,runner:async (operationId,checkpoint)=>{calls.push(operationId);expect(checkpoint).toBe(checkpointId);return {targetVmId:LIVE_TARGET.vmId,checkpointId}}})
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  const url=`http://127.0.0.1:${server.address().port}/v1/action`
  const request=(body,headers={})=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)})
  const inspect={operationId:'real-host-inspect-v1',approvalId:approval.approvalId,runId:null}
  expect((await request(inspect)).status).toBe(403)
  expect((await request(inspect,{Authorization:`Bearer ${'t'.repeat(40)}`,Origin:'http://localhost:5173'})).status).toBe(403)
  expect((await request({...inspect,operationId:'run-powershell'}, {Authorization:`Bearer ${'t'.repeat(40)}`})).status).toBe(409)
  expect((await request(inspect,{Authorization:`Bearer ${'t'.repeat(40)}`})).status).toBe(200)
  const claim={operationId:'real-host-claim-v1',approvalId:approval.approvalId,runId:'00000000-0000-4000-8000-000000000003'}
  expect((await request(claim,{Authorization:`Bearer ${'t'.repeat(40)}`})).status).toBe(200)
  expect((await request({...claim,runId:'00000000-0000-4000-8000-000000000004'},{Authorization:`Bearer ${'t'.repeat(40)}`})).status).toBe(409)
  const reset={operationId:'real-host-reset-v1',approvalId:approval.approvalId,runId:'00000000-0000-4000-8000-000000000003'}
  expect((await request(reset,{Authorization:`Bearer ${'t'.repeat(40)}`})).status).toBe(200)
  expect((await request(reset,{Authorization:`Bearer ${'t'.repeat(40)}`})).status).toBe(409)
  expect((await request({...reset,runId:'00000000-0000-4000-8000-000000000004'},{Authorization:`Bearer ${'t'.repeat(40)}`})).status).toBe(409)
  expect(calls).toEqual(['real-host-inspect-v1','real-host-claim-v1','real-host-reset-v1'])
  expect(journal.db.prepare('SELECT status, finished_at FROM actions').get()).toMatchObject({status:'pass',finished_at:expect.any(String)})
})
