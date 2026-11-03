import { readFileSync,existsSync,writeFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { win32 } from 'node:path'
import { performance } from 'node:perf_hooks'

const knownHostCodes=['VM_IDENTITY_MISMATCH','CHECKPOINT_ID_MISMATCH','CHECKPOINT_TYPE_MISMATCH','TARGET_DISK_MISMATCH','DISK_CHAIN_INVALID','DISK_CHAIN_BASE_MISMATCH','BACKUP_MISSING','BACKUP_HASH_MISMATCH','MANAGEMENT_BINDING_MISMATCH','RESOURCE_UNKNOWN','B5_OPERATOR_LEASE_UNRESOLVED']
const safeCodes=new Set(['EACCES','EPERM','ENOENT','ETIMEDOUT','ENOBUFS','ERR_SQLITE_ERROR','ERR_CHILD_PROCESS_STDIO_MAXBUFFER','ERR_INVALID_ARG_TYPE'])
const domainCodes=new Set([...knownHostCodes,'TRIAL_ORIGINAL_MISMATCH','TRIAL_CHECKPOINT_MISMATCH','TRIAL_OTHER_VM_STATE_MISMATCH','TRIAL_BACKUP_MISMATCH','TRIAL_RESOURCES_FAILED','MAINTENANCE_DATABASE_MISSING','MAINTENANCE_DATABASE_VERSION_UNSUPPORTED','MAINTENANCE_CONTROL_SCHEMA_INCOMPLETE'])
export function safeUpgradeFailure(error){
  const hostCode=knownHostCodes.find(code=>String(error?.stderr??'').includes(code))
  return {name:['Error','TypeError','SyntaxError','RangeError'].includes(error?.name)?error.name:'Error',
    code:hostCode??(safeCodes.has(error?.code)?error.code:domainCodes.has(error?.message)?error.message:'UNCLASSIFIED_FAILURE'),
    exitCode:Number.isInteger(error?.code)?error.code:null,
    sqliteCode:Number.isInteger(error?.errcode)?error.errcode:null,
    signal:['SIGTERM','SIGKILL','SIGINT'].includes(error?.signal)?error.signal:null,killed:error?.killed===true}
}

export function preserveUpgradeFailure(filename,{stage,ownerId,releaseRoot},error){
  const record={checkedAt:new Date().toISOString(),stage,ownerId,releaseRoot,failure:safeUpgradeFailure(error)}
  try{writeFileSync(filename,JSON.stringify(record,null,2),{flag:'wx'});return {recorded:true}}
  catch(writeError){return {recorded:false,existingPreserved:writeError.code==='EEXIST'}}
}

function readEvidence(filename){
  const text=readFileSync(filename,'utf8')
  return {value:JSON.parse(text.replace(/^\uFEFF/,'')),utf8Bom:text.charCodeAt(0)===0xfeff}
}

export async function probeStagedHost(record,{exec=promisify(execFile),now=()=>performance.now()}={}){
  if(!/^C:\\Program Files\\TicketSimPilot\\releases\\[0-9a-f-]{36}$/i.test(record?.releaseRoot??''))throw new Error('STAGED_PROBE_ROOT_INVALID')
  const root=record.releaseRoot,timeoutMs=50_000,start=now()
  const saved={pwsh:process.env.TICKETSIM_PWSH,modules:process.env.PSModulePath}
  try{
    process.env.TICKETSIM_PWSH=win32.join(root,'powershell/pwsh.exe')
    process.env.PSModulePath=`${win32.join(root,'powershell/Modules')};C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\Modules;C:\\Program Files\\WindowsPowerShell\\Modules`
    const args=['-NoProfile','-NonInteractive','-File',win32.join(root,'scripts/real-lab/Invoke-LabHost.ps1'),'-Action','inspect','-CheckpointId','e6d04330-142c-4397-8e0d-ddf5a9e69090']
    let result
    try{result=await exec(process.env.TICKETSIM_PWSH,args,{timeout:timeoutMs,windowsHide:true,maxBuffer:8192})}
    catch(error){return {outcome:'failed',elapsedMs:Math.round(now()-start),timeoutMs,failure:safeUpgradeFailure(error),stdoutBytes:Buffer.byteLength(String(error.stdout??'')),stderrBytes:Buffer.byteLength(String(error.stderr??''))}}
    let host
    try{host=JSON.parse(result.stdout)}catch(error){return {outcome:'invalid_json',elapsedMs:Math.round(now()-start),timeoutMs,failure:safeUpgradeFailure(error),stdoutBytes:Buffer.byteLength(result.stdout),startsWithBom:result.stdout.charCodeAt(0)===0xfeff,warningInStdout:/^WARNING:/mi.test(result.stdout)}}
    return {outcome:'pass',elapsedMs:Math.round(now()-start),timeoutMs,host:{targetVmId:host.targetVmId,targetState:host.targetState,protectedState:host.protectedState,recoveryState:host.recoveryState,checkpointId:host.checkpointId,checkpointCount:host.checkpointCount}}
  }finally{
    if(saved.pwsh===undefined)delete process.env.TICKETSIM_PWSH;else process.env.TICKETSIM_PWSH=saved.pwsh
    if(saved.modules===undefined)delete process.env.PSModulePath;else process.env.PSModulePath=saved.modules
  }
}

/** Purely read-only diagnostic. Never constructs a writable journal, releases
 * a gate, starts/stops a process or retries an upgrade. File paths are trusted
 * startup/test dependencies; the CLI below uses only fixed protected locations.
 */
export async function inspectUpgradeFailure({stateRoot,readReport,inspectState}){
  const result={checkedAt:new Date().toISOString(),readOnly:true,upgrade:null,evidenceFiles:{},control:null}
  let record
  for(const [key,name] of Object.entries({upgrade:'m4-upgrade.json',m1:'m1-evidence.json',processes:'processes.json',preparation:'preparation.json'})){
    const filename=`${stateRoot}/operator/${name}`
    try{
      const read=readEvidence(filename)
      result.evidenceFiles[key]={readable:true,utf8Bom:read.utf8Bom}
      if(key==='upgrade'){
        record=read.value
        result.upgrade={phase:record.phase,ownerId:record.ownerId,releaseRoot:record.releaseRoot,startedAt:record.startedAt}
      }
    }catch(error){result.evidenceFiles[key]={readable:false,failure:safeUpgradeFailure(error)}}
  }
  const resumeFilename=`${stateRoot}/operator/m4-resume.json`
  if(existsSync(resumeFilename)){
    try{
      const resumed=readEvidence(resumeFilename)
      result.originalUpgrade=result.upgrade
      record=resumed.value
      result.upgrade={phase:record.phase,ownerId:record.ownerId,releaseRoot:record.releaseRoot,startedAt:record.startedAt,resumedAt:record.resumedAt}
      result.evidenceFiles.resume={readable:true,utf8Bom:resumed.utf8Bom}
    }catch(error){result.evidenceFiles.resume={readable:false,failure:safeUpgradeFailure(error)}}
  }
  let db
  try{
    db=new DatabaseSync(`${stateRoot}/operator/actions.sqlite`,{readOnly:true});db.exec('PRAGMA query_only=ON')
    const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('control_gate','control_events')").all()
    if(tables.length===2){
      result.control={gates:db.prepare('SELECT vm_id,kind,owner_id FROM control_gate').all(),
        events:db.prepare('SELECT sequence,kind,reference_id,occurred_ms FROM control_events ORDER BY sequence DESC LIMIT 12').all().reverse()}
    }else result.control={schemaPresent:false}
  }catch(error){result.control={failure:safeUpgradeFailure(error)}}finally{db?.close()}
  result.archiveExists={m1:existsSync(`${stateRoot}/operator/m4-previous-m1.json`),processes:existsSync(`${stateRoot}/operator/m4-previous-processes.json`)}
  if(inspectState){try{result.maintenance=inspectState(record?.phase==='installed'?null:record?.ownerId??null)}catch(error){result.maintenance={failure:safeUpgradeFailure(error)}}}
  if(readReport){
    try{
      const report=await readReport()
      result.m3={livePass:report.livePass,runId:report.runId,phase:report.phase,resetAttempts:report.resetAttempts,leaseClear:report.leaseClear,workClear:report.workClear,
        targetState:report.host?.targetState,recoveryState:report.host?.recoveryState,protectedState:report.host?.protectedState}
    }catch(error){result.m3={failure:safeUpgradeFailure(error)}}
  }
  return result
}
