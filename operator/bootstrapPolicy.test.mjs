import { expect,it } from 'vitest'
import { mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join,resolve,sep } from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { verifyRelease,assertOperatorToken,assertUpgradeReadiness } from './bootstrapPolicy.mjs'

const sha=value=>createHash('sha256').update(value).digest('hex')
function fixture(work){
  const base=mkdtempSync(join(tmpdir(),'ticketsim-release-')),root=join(base,'release')
  mkdirSync(root)
  try{work({base,root})}finally{
    if(!resolve(base).startsWith(`${resolve(tmpdir())}${sep}ticketsim-release-`))throw new Error('UNSAFE_TEST_CLEANUP')
    rmSync(base,{recursive:true,force:true})
  }
}
function manifest(root,files=[{path:'entry.mjs',sha256:sha('authored')}]){
  const bytes=JSON.stringify({schemaVersion:1,files});writeFileSync(join(root,'release-manifest.json'),bytes);return sha(bytes)
}
it('verifies complete release inventory and refuses changed, extra, missing and hidden files',()=>fixture(({root})=>{
  writeFileSync(join(root,'entry.mjs'),'authored');const digest=manifest(root)
  expect(verifyRelease(root,digest).fileCount).toBe(1)
  writeFileSync(join(root,'entry.mjs'),'changed');expect(()=>verifyRelease(root,digest)).toThrow('RELEASE_FILE_CHANGED')
  writeFileSync(join(root,'entry.mjs'),'authored');writeFileSync(join(root,'.extra'),'hidden')
  expect(()=>verifyRelease(root,digest)).toThrow('RELEASE_EXTRA_FILE')
  rmSync(join(root,'.extra'));rmSync(join(root,'entry.mjs'))
  expect(()=>verifyRelease(root,digest)).toThrow('RELEASE_FILE_MISSING')
}))
it('rejects escaped paths, case aliases and manifest changes',()=>fixture(({root})=>{
  for(const path of ['../outside','/absolute','entry\\file','C:/elsewhere','a/./b']){
    const digest=manifest(root,[{path,sha256:sha('authored')}]);expect(()=>verifyRelease(root,digest)).toThrow('INVALID_RELEASE_ENTRY')
  }
  let digest=manifest(root,[{path:'entry.mjs',sha256:sha('authored')},{path:'ENTRY.MJS',sha256:sha('authored')}])
  expect(()=>verifyRelease(root,digest)).toThrow('DUPLICATE_RELEASE_ENTRY')
  digest=manifest(root);writeFileSync(join(root,'release-manifest.json'),'{}');expect(()=>verifyRelease(root,digest)).toThrow('RELEASE_MANIFEST_CHANGED')
}))
it('refuses directory junctions before traversing to an external payload',()=>fixture(({root,base})=>{
  const elsewhere=join(base,'elsewhere');mkdirSync(elsewhere);writeFileSync(join(elsewhere,'entry.mjs'),'authored')
  writeFileSync(join(root,'entry.mjs'),'authored');const digest=manifest(root)
  symlinkSync(elsewhere,join(root,'redirect'),process.platform==='win32'?'junction':'dir')
  expect(()=>verifyRelease(root,digest)).toThrow('RELEASE_LINK_FORBIDDEN')
}))
it('requires actual elevated Operator membership, exact identity/SID and Hyper-V readability',()=>{
  const actual={Principal:'SONNGUYEN\\Admin',Sid:'S-1-5-21-3276894829-3488928311-148614882-1001',Elevated:true,AdministratorMember:true,HyperVReadable:true}
  expect(assertOperatorToken(actual,'SONNGUYEN\\Admin')).toBe(actual)
  for(const patch of [{Elevated:false},{AdministratorMember:false},{HyperVReadable:'unknown'},{Principal:'SONNGUYEN\\TicketSimAgent'},{Sid:'unknown'}])expect(()=>assertOperatorToken({...actual,...patch},'SONNGUYEN\\Admin')).toThrow('OPERATOR_TOKEN_NOT_VERIFIED')
})
it('requires fresh trusted TLS/owner evidence and a terminal-only isolated learner restart',()=>{
  const runtime={pid:123,sid:'operator-sid',principal:'SONNGUYEN\\Admin',releaseRoot:resolve('release'),approvalOnly:true,qualifiedPacks:0}
  const record={releaseRoot:runtime.releaseRoot,operatorPrincipal:runtime.principal}
  const readiness={TlsVerified:true,AgentTerminalOnly:true,OperatorControlVerified:true,ControlPid:123,ControlSid:'operator-sid',CheckedAt:new Date(1000).toISOString()}
  const m1={Pass:true,TlsVerified:true,AgentNodePid:345,Runtime:{pid:345,terminalOnly:true}}
  expect(assertUpgradeReadiness({readiness,runtime,m1,record,now:1001})).toBe(readiness)
  for(const patch of [{TlsVerified:false},{AgentTerminalOnly:false},{ControlPid:999},{ControlSid:'other'},{CheckedAt:new Date(1002).toISOString()}])expect(()=>assertUpgradeReadiness({readiness:{...readiness,...patch},runtime,m1,record,now:1001})).toThrow('UPGRADE_READINESS_NOT_VERIFIED')
  expect(()=>assertUpgradeReadiness({readiness,runtime,m1,record,now:61001})).toThrow('UPGRADE_READINESS_NOT_VERIFIED')
})

it('refuses privileged entry points from the writable source checkout before accessing machine state',()=>{
  for(const [path,code] of [['./bootstrap.mjs','PROTECTED_OPERATOR_BOOTSTRAP_REQUIRED'],['./upgrade.mjs','PROTECTED_UPGRADE_ENTRY_REQUIRED'],['../scripts/real-lab/Verify-OperatorRelease.mjs','PROTECTED_RELEASE_VERIFIER_REQUIRED']]){
    const result=spawnSync(process.execPath,[fileURLToPath(new URL(path,import.meta.url))],{encoding:'utf8',windowsHide:true,timeout:10_000})
    expect(result.status).toBe(1);expect(result.stdout).toBe('');expect(result.stderr).toContain(code)
  }
})
