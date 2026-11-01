import { createHash } from 'node:crypto'
import { expect, it } from 'vitest'
import { LiveOperations } from './liveOperations.mjs'
import { LIVE_TARGET, checkVerdict, liveChecks } from './livePolicy.mjs'

const page='TicketSim LAB-WEB-001 baseline v1\n'
const firewall='table inet filter {}'
const firewallHash=createHash('sha256').update(`${firewall}\n`).digest('hex')
const approval={checkpointId:'00000000-0000-4000-8000-000000000002',b5Status:'PASS',baselineHashes:{sshConfig:'a'.repeat(64),firewall:firewallHash}}
const host={targetVmId:LIVE_TARGET.vmId,targetName:'ticketsim-lab',targetState:'Running',recoveryVmId:LIVE_TARGET.recoveryVmId,recoveryState:'Off',protectedVmId:LIVE_TARGET.protectedVmId,protectedName:'lab1',checkpointId:approval.checkpointId,checkpointName:LIVE_TARGET.checkpointName,checkpointCount:1,backupSha256:LIVE_TARGET.backupVhdSha256,managementSwitchId:'4277a35c-217f-4096-a1a9-a691975f150f',freeRamBytes:2*1024**3,cFreeBytes:15*1024**3,eFreeBytes:50*1024**3}
const outputs={
  'real-web-identity-v1':{stdout:'ticketsim-lab\n2: eth1 inet 10.77.77.3/24 scope global eth1\n',stderr:''},
  'real-web-nginx-config-v1':{stdout:'',stderr:'nginx: syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful\n'},
  'real-web-ssh-config-v1':{stdout:'',stderr:''},
  'real-web-nginx-status-v1':{stdout:'active\n',stderr:''},
  'real-web-page-hash-v1':{stdout:`${LIVE_TARGET.pageSha256}  /var/www/html/index.html\n`,stderr:''},
  'real-web-nginx-hash-v1':{stdout:`${LIVE_TARGET.nginxConfigSha256}  /etc/nginx/nginx.conf\n`,stderr:''},
  'real-web-netplan-hash-v1':{stdout:`${LIVE_TARGET.netplanSha256}  /etc/netplan/50-cloud-init.yaml\n`,stderr:''},
  'real-web-cloudinit-hash-v1':{stdout:`${LIVE_TARGET.cloudInitSha256}  /etc/cloud/cloud.cfg.d/99-ticketsim-network.cfg\n`,stderr:''},
  'real-web-ssh-hash-v1':{stdout:`${approval.baselineHashes.sshConfig}  /etc/ssh/sshd_config\n`,stderr:''},
  'real-web-firewall-v1':{stdout:`${firewall}\n`,stderr:''},
  'real-web-route-v1':{stdout:'10.77.77.1 dev eth1 src 10.77.77.3 uid 999\n',stderr:''},
  'real-web-stop-nginx-v1':{stdout:'',stderr:''},
}
function fixture({changes={},httpStatus=200,httpBody=page,sshLost=false,refused=false}={}) {
  const calls=[]
  const exec=async (file,args)=>{
    calls.push({file,args})
    if(file==='ssh-keygen') return {stdout:`256 ${LIVE_TARGET.sshFingerprint} (ED25519)`,stderr:''}
    const id=args.at(-1)
    if(sshLost) throw Object.assign(new Error('connection failed'),{code:255,stdout:'',stderr:'connection failed'})
    const result=changes[id] ?? outputs[id]
    if(!result) throw new Error('unknown operation')
    if(result.error) throw Object.assign(new Error('remote error'),{code:result.error,stdout:result.stdout??'',stderr:result.stderr??''})
    return result
  }
  const fetcher=async()=>{
    if(refused) throw {cause:{code:'ECONNREFUSED'}}
    return new Response(httpBody,{status:httpStatus})
  }
  const operations=new LiveOperations({hostBridge:{inspect:async()=>host,reset:async()=>{}},sshKeyPath:'C:\\private\\agent-key',knownHostsPath:'C:\\private\\known-hosts',exec,fetcher})
  return {operations,calls}
}

it('uses only reviewed guest operation IDs and independently checks exact HTTP bytes',async()=>{
  const {operations,calls}=fixture()
  const observed=await operations.observe('preflight',approval)
  expect(checkVerdict(observed.checks,liveChecks.preflight)).toBe('pass')
  await operations.inject()
  expect(calls.filter(call=>call.file==='ssh').map(call=>call.args.at(-1))).toContain('real-web-stop-nginx-v1')
  expect(calls.some(call=>call.args.some(arg=>arg.includes('powershell')))).toBe(false)
})

it('distinguishes SSH loss, HTTP mismatch and inconclusive HTTP',async()=>{
  const lost=await fixture({sshLost:true,refused:true}).operations.observe('fault',approval)
  expect(lost.checks.sshAuthentication).toBe('unknown')
  expect(checkVerdict(lost.checks,liveChecks.fault)).toBe('unknown')
  const mismatch=await fixture({httpBody:'wrong'}).operations.observe('grade',approval)
  expect(mismatch.checks.httpContent).toBe('fail')
  const inconclusive=await fixture({refused:true}).operations.observe('grade',approval)
  expect(inconclusive.checks.httpStatus).toBe('unknown')
  expect(checkVerdict(inconclusive.checks,liveChecks.grade)).toBe('unknown')
})

it('requires unchanged network and SSH configuration during grading',async()=>{
  const changed=await fixture({changes:{'real-web-ssh-hash-v1':{stdout:`${'f'.repeat(64)}  /etc/ssh/sshd_config\n`,stderr:''}}}).operations.observe('grade',approval)
  expect(changed.checks.sshConfigHash).toBe('fail')
  expect(checkVerdict(changed.checks,liveChecks.grade)).toBe('fail')
})
