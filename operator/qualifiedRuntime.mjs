import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { win32 } from 'node:path'
import { execFileSync } from 'node:child_process'

export const QUALIFIED_INSTALL='C:\\Program Files\\TicketSimPilot'
export const QUALIFIED_PWSH=win32.join(QUALIFIED_INSTALL,'powershell/pwsh.exe')
export function parseQualifiedJson(value,source){
  const bytes=Buffer.isBuffer(value)?value:Buffer.from(String(value),'utf8')
  const text=bytes.toString('utf8')
  try{return JSON.parse(text.trim())}catch{
    const error=new SyntaxError('QUALIFIED_JSON_INVALID')
    error.verificationStage=source
    error.jsonMetadata={source,bytes:bytes.length,empty:text.trim().length===0,utf8Bom:text.charCodeAt(0)===0xfeff,warningLine:/^WARNING:/mi.test(text)}
    throw error
  }
}
export function verifyQualifiedRuntime(){
  const preparation=JSON.parse(readFileSync('C:/ProgramData/TicketSimPilot/operator/preparation.json','utf8').trim())
  for(const name of ['node.exe','powershell\\pwsh.exe','operator\\server.mjs','scripts\\real-lab\\Invoke-LabHost.ps1']){
    const expected=preparation.CodeHashes?.[name]
    const actual=createHash('sha256').update(readFileSync(win32.join(QUALIFIED_INSTALL,name))).digest('hex')
    if(typeof expected!=='string'||actual!==expected.toLowerCase())throw new Error('QUALIFIED_RUNTIME_HASH_CHANGED')
  }
}

// Upgrade compatibility bridge only. No fallback to a per-user binary, no
// action replay and no change to the learner/reset engine's transport policy.
export async function withQualifiedPowerShell(work,{verify=verifyQualifiedRuntime,env=process.env}={}){
  verify()
  const before={pwsh:env.TICKETSIM_PWSH,modules:env.PSModulePath}
  env.TICKETSIM_PWSH=QUALIFIED_PWSH
  env.PSModulePath=`${win32.join(QUALIFIED_INSTALL,'powershell/Modules')};C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\Modules;C:\\Program Files\\WindowsPowerShell\\Modules`
  try{return await work()}finally{
    if(before.pwsh===undefined)delete env.TICKETSIM_PWSH;else env.TICKETSIM_PWSH=before.pwsh
    if(before.modules===undefined)delete env.PSModulePath;else env.PSModulePath=before.modules
  }
}
export async function readQualifiedTrialReport({verify=verifyQualifiedRuntime,env=process.env,run=execFileSync}={}){
  return withQualifiedPowerShell(async()=>{
    // Preserve the qualified Node executable as well as its script/module and
    // PowerShell paths. Importing its module into the staged Node would still
    // leave the parent-process execution context changed.
    const stdout=run(win32.join(QUALIFIED_INSTALL,'node.exe'),[win32.join(QUALIFIED_INSTALL,'agent/trialReport.mjs')],
      {encoding:'utf8',timeout:180_000,windowsHide:true,maxBuffer:16_384,stdio:['ignore','pipe','pipe'],env})
    return parseQualifiedJson(stdout,'qualified_trial_report_stdout')
  },{verify,env})
}

// Same immutable, hash-verified inspect entry and 50-second policy as the
// original runner. Capture its raw JSON boundary for precise safe diagnosis.
// There is exactly one read-only dispatch and no retry/reset fallback.
export async function readQualifiedHostInspection({verify=verifyQualifiedRuntime,env=process.env,run=execFileSync}={}){
  return withQualifiedPowerShell(()=>{
    const stdout=run(QUALIFIED_PWSH,['-NoProfile','-NonInteractive','-File',win32.join(QUALIFIED_INSTALL,'scripts/real-lab/Invoke-LabHost.ps1'),'-Action','inspect','-CheckpointId','e6d04330-142c-4397-8e0d-ddf5a9e69090'],
      {encoding:'utf8',timeout:50_000,windowsHide:true,maxBuffer:8192,stdio:['ignore','pipe','pipe'],env})
    return parseQualifiedJson(stdout,'qualified_host_inspect_stdout')
  },{verify,env})
}
