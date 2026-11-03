import { createHash } from 'node:crypto'
import { readFileSync,readdirSync,lstatSync,realpathSync } from 'node:fs'
import { resolve,relative,sep } from 'node:path'

const requireCheck=(condition,code)=>{if(!condition)throw new Error(code)}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex')

// A complete file inventory, rather than a few entry-point hashes. The digest
// is pinned by the elevated installer in protected machine state.
export function verifyRelease(root,expectedManifestSha256){
  requireCheck(typeof expectedManifestSha256==='string'&&/^[a-f0-9]{64}$/.test(expectedManifestSha256),'RELEASE_DIGEST_REQUIRED')
  const absolute=resolve(root)
  requireCheck(!lstatSync(absolute).isSymbolicLink()&&realpathSync(absolute).toLowerCase()===absolute.toLowerCase(),'RELEASE_ROOT_REDIRECTED')
  requireCheck(!lstatSync(resolve(absolute,'release-manifest.json')).isSymbolicLink(),'RELEASE_LINK_FORBIDDEN')
  const manifestBytes=readFileSync(resolve(absolute,'release-manifest.json'))
  requireCheck(sha(manifestBytes)===expectedManifestSha256,'RELEASE_MANIFEST_CHANGED')
  const manifest=JSON.parse(manifestBytes.toString('utf8'))
  requireCheck(manifest.schemaVersion===1&&Array.isArray(manifest.files)&&manifest.files.length>0,'INVALID_RELEASE_MANIFEST')
  const expected=new Map()
  for(const file of manifest.files){
    requireCheck(file&&typeof file.path==='string'&&file.path!=='release-manifest.json'&&!file.path.includes('\\')&&file.path.split('/').every(part=>part&&!['.','..'].includes(part))&&!file.path.includes(':')&&/^[a-f0-9]{64}$/.test(file.sha256),'INVALID_RELEASE_ENTRY')
    requireCheck(!expected.has(file.path.toLowerCase()),'DUPLICATE_RELEASE_ENTRY')
    const filename=resolve(absolute,file.path)
    requireCheck(filename.startsWith(`${absolute}${sep}`),'RELEASE_PATH_ESCAPE')
    expected.set(file.path.toLowerCase(),file.sha256)
  }
  let verified=0
  function walk(directory){
    for(const entry of readdirSync(directory,{withFileTypes:true})){
      const filename=resolve(directory,entry.name),name=relative(absolute,filename).split(sep).join('/')
      requireCheck(!entry.isSymbolicLink(),'RELEASE_LINK_FORBIDDEN')
      if(entry.isDirectory())walk(filename)
      else{
        requireCheck(entry.isFile(),'RELEASE_SPECIAL_FILE_FORBIDDEN')
        if(name==='release-manifest.json')continue
        requireCheck(expected.has(name.toLowerCase()),'RELEASE_EXTRA_FILE')
        requireCheck(sha(readFileSync(filename))===expected.get(name.toLowerCase()),'RELEASE_FILE_CHANGED')
        verified++
      }
    }
  }
  walk(absolute)
  requireCheck(verified===expected.size,'RELEASE_FILE_MISSING')
  return {verified:true,fileCount:verified,manifestSha256:expectedManifestSha256}
}

export function assertOperatorToken(identity,expectedPrincipal){
  requireCheck(identity?.Elevated===true&&identity.AdministratorMember===true&&identity.HyperVReadable===true&&
    typeof identity.Principal==='string'&&identity.Principal.toLowerCase()===expectedPrincipal?.toLowerCase()&&
    !/\\TicketSimAgent$/i.test(identity.Principal)&&/^S-1-5-21-(?:\d+-){3}\d+$/.test(identity.Sid??''),'OPERATOR_TOKEN_NOT_VERIFIED')
  return identity
}

export function assertUpgradeReadiness({readiness,runtime,m1,record,now=Date.now()}){
  requireCheck(readiness?.TlsVerified===true&&readiness.AgentTerminalOnly===true&&readiness.OperatorControlVerified===true&&
    readiness.ControlPid===runtime?.pid&&readiness.ControlSid===runtime.sid&&runtime.principal===record.operatorPrincipal&&
    resolve(runtime.releaseRoot)===resolve(record.releaseRoot)&&runtime.approvalOnly===true&&runtime.qualifiedPacks===0&&
    m1?.Pass===true&&m1.TlsVerified===true&&m1.Runtime?.terminalOnly===true&&m1.Runtime?.pid===m1.AgentNodePid&&
    Number.isFinite(Date.parse(readiness.CheckedAt))&&now-Date.parse(readiness.CheckedAt)>=0&&now-Date.parse(readiness.CheckedAt)<=60_000,'UPGRADE_READINESS_NOT_VERIFIED')
  return readiness
}
