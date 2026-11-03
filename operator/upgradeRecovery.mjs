import { readFileSync,existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { LIVE_TARGET } from '../agent/livePolicy.mjs'

export const evidenceHash=bytes=>createHash('sha256').update(bytes).digest('hex')
const check=(valid,code)=>{if(!valid)throw new Error(code)}
export function readActiveUpgrade(stateRoot){
  const originalFile=join(stateRoot,'operator/m4-upgrade.json'),bytes=readFileSync(originalFile),original=JSON.parse(bytes.toString('utf8').trim())
  const resumeFile=join(stateRoot,'operator/m4-resume.json')
  if(!existsSync(resumeFile))return {record:original,filename:originalFile,original}
  const record=JSON.parse(readFileSync(resumeFile,'utf8').trim())
  check(original.phase==='locked'&&record.ownerId===original.ownerId&&record.releaseRoot!==original.releaseRoot&&
    record.resumedFrom?.recordSha256===evidenceHash(bytes)&&record.resumedFrom.releaseRoot===original.releaseRoot&&record.resumedFrom.manifestSha256===original.manifestSha256,'UPGRADE_RECOVERY_CHAIN_CHANGED')
  return {record,filename:resumeFile,original}
}
export function assertLockedRecovery({original,gates,events,archiveExists,stateClear,resumeExists,grants,attempts}){
  check(original?.phase==='locked'&&resumeExists===false,'LOCKED_RECOVERY_NOT_ELIGIBLE')
  check(Array.isArray(gates)&&gates.length===1&&gates[0].vm_id===LIVE_TARGET.vmId&&gates[0].kind==='maintenance'&&gates[0].owner_id===original.ownerId,'UPGRADE_GATE_OWNER_MISMATCH')
  check(events.length===2&&events[0].kind==='maintenance_acquired'&&events[1].kind==='maintenance_failed'&&events.every(event=>event.reference_id===original.ownerId),'UPGRADE_RECOVERY_ALREADY_ADVANCED')
  check(archiveExists.m1===false&&archiveExists.processes===false&&stateClear===true&&grants===0&&attempts===0,'UPGRADE_RECOVERY_STATE_NOT_CLEAR')
  return true
}

export function assertRetiredContinuation({record,gates,events,stateClear,continuationExists,grants,attempts}){
  check(record?.phase==='retired'&&continuationExists===false,'RETIRED_CONTINUATION_NOT_ELIGIBLE')
  check(gates.length===1&&gates[0].vm_id===LIVE_TARGET.vmId&&gates[0].kind==='maintenance'&&gates[0].owner_id===record.ownerId,'UPGRADE_GATE_OWNER_MISMATCH')
  check(events.length>0&&events[events.length-1].kind==='legacy_state_rechecked'&&events[events.length-1].reference_id===record.ownerId,'RETIRED_CONTINUATION_REQUIRES_REVIEW')
  check(stateClear===true&&grants===0&&attempts===0,'UPGRADE_RECOVERY_STATE_NOT_CLEAR')
  return true
}
