import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
import { LabError } from './errors.mjs'
import { LIVE_TARGET } from './livePolicy.mjs'
import { setTimeout as delay } from 'node:timers/promises'

const runFile = promisify(execFile)
const PASS = 'pass', FAIL = 'fail', UNKNOWN = 'unknown'
const page = Buffer.from('TicketSim LAB-WEB-001 baseline v1\n')
const hash = value => createHash('sha256').update(value).digest('hex')
const commands = Object.freeze({
  identity: 'real-web-identity-v1', nginxConfig: 'real-web-nginx-config-v1', sshConfig: 'real-web-ssh-config-v1',
  nginxService: 'real-web-nginx-status-v1', pageHash: 'real-web-page-hash-v1', configHash: 'real-web-nginx-hash-v1',
  netplanHash: 'real-web-netplan-hash-v1', cloudInitHash: 'real-web-cloudinit-hash-v1', sshConfigHash: 'real-web-ssh-hash-v1',
  firewallHash: 'real-web-firewall-v1', managementRoute: 'real-web-route-v1', stopNginx: 'real-web-stop-nginx-v1',
})

function status(test, observed) { return observed === null ? UNKNOWN : test(observed) ? PASS : FAIL }
function hostStatus(host, fields, test) { return !host || fields.some(field => host[field] === undefined || host[field] === null) ? UNKNOWN : test(host) ? PASS : FAIL }
function commandStatus(result, test) { return result.ok ? status(test, result.text) : Number.isInteger(result.code) && result.code !== 255 ? FAIL : UNKNOWN }

export class LiveOperations {
  constructor({ hostBridge, sshKeyPath, knownHostsPath, sshUser = 'ticketsim-agent', exec = runFile, fetcher = fetch } = {}) {
    if (!hostBridge || !sshKeyPath || !knownHostsPath || sshUser !== 'ticketsim-agent') throw new LabError('LIVE_TRANSPORT_NOT_CONFIGURED')
    this.hostBridge = hostBridge; this.sshKeyPath = sshKeyPath; this.knownHostsPath = knownHostsPath; this.exec = exec; this.fetcher = fetcher
  }
  async #ssh(commandId) {
    const command = commands[commandId]
    if (!command) throw new LabError('UNKNOWN_GUEST_OPERATION')
    const args = ['-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o',`UserKnownHostsFile=${this.knownHostsPath}`,'-o','ConnectTimeout=5','-o','ConnectionAttempts=1','-i',this.sshKeyPath,`ticketsim-agent@${LIVE_TARGET.managementIp}`,command]
    try { const result = await this.exec('ssh', args, { timeout: 12_000, windowsHide: true, maxBuffer: 8192 }); return { ok: true, text: result.stdout.trim(), stderr: result.stderr.trim() } }
    catch (error) { return { ok: false, text: String(error?.stdout ?? '').trim().slice(0, 200), stderr: String(error?.stderr ?? '').slice(0, 200), code: error?.code } }
  }
  async #http() {
    try {
      const response = await this.fetcher(`http://${LIVE_TARGET.managementIp}/`, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
      const bytes = Buffer.from(await response.arrayBuffer())
      if (bytes.length > 4096) return { status: response.status, bytes: null }
      return { status: response.status, bytes }
    } catch (error) {
      const code = error?.cause?.code ?? error?.code
      return { status: null, bytes: null, refused: code === 'ECONNREFUSED' }
    }
  }
  async #fingerprint() {
    try {
      const result = await this.exec('ssh-keygen', ['-lf', this.knownHostsPath], { timeout: 5000, windowsHide: true, maxBuffer: 4096 })
      return result.stdout.includes(LIVE_TARGET.sshFingerprint) ? PASS : FAIL
    } catch { return UNKNOWN }
  }
  async observe(stage, approval) {
    const host = await this.hostBridge.inspect(approval)
    const checks = {
      vmIdentity: hostStatus(host,['targetVmId','targetName'],x => x.targetVmId.toLowerCase() === LIVE_TARGET.vmId && x.targetName === 'ticketsim-lab'),
      protectedIdentity: hostStatus(host,['protectedVmId','protectedName'],x => x.protectedVmId.toLowerCase() === LIVE_TARGET.protectedVmId && x.protectedName === 'lab1'),
      recoveryStopped: hostStatus(host,['recoveryVmId','recoveryState'],x => x.recoveryVmId.toLowerCase() === LIVE_TARGET.recoveryVmId && x.recoveryState === 'Off'),
      checkpointIdentity: hostStatus(host,['checkpointId','checkpointName','checkpointCount'],x => x.checkpointId.toLowerCase() === approval.checkpointId.toLowerCase() && x.checkpointName === LIVE_TARGET.checkpointName && x.checkpointCount === 1),
      b5Proof: approval.b5Status === 'PASS' ? PASS : FAIL,
      backupHash: hostStatus(host,['backupSha256'],x => x.backupSha256.toUpperCase() === LIVE_TARGET.backupVhdSha256),
      hostRam: hostStatus(host,['freeRamBytes'],x => Number.isFinite(x.freeRamBytes) && x.freeRamBytes >= 1 * 1024 ** 3),
      diskC: hostStatus(host,['cFreeBytes'],x => Number.isFinite(x.cFreeBytes) && x.cFreeBytes >= 12 * 1024 ** 3),
      diskE: hostStatus(host,['eFreeBytes'],x => Number.isFinite(x.eFreeBytes) && x.eFreeBytes >= 15 * 1024 ** 3),
      managementAvailable: hostStatus(host,['targetState','managementSwitchId'],x => x.targetState === 'Running' && x.managementSwitchId === '4277a35c-217f-4096-a1a9-a691975f150f'),
      finalState: hostStatus(host,['targetState','recoveryState'],x => x.targetState === 'Running' && x.recoveryState === 'Off'),
    }
    const ssh = await this.#ssh('identity')
    const fingerprint = await this.#fingerprint()
    const probeIds = ['sshConfig','nginxConfig','nginxService','pageHash','configHash','netplanHash','cloudInitHash','sshConfigHash','firewallHash','managementRoute']
    const results = []
    if (ssh.ok) {
      for (let index = 0; index < probeIds.length; index += 3) results.push(...await Promise.all(probeIds.slice(index,index+3).map(id => this.#ssh(id))))
    } else results.push(...probeIds.map(() => ({ ok:false, text:'', code:255 })))
    const [sshConfig, nginxConfig, nginxService, pageHash, configHash, netplanHash, cloudInitHash, sshConfigHash, firewallHash, managementRoute] = results
    const http = await this.#http()
    checks.sshAuthentication = ssh.ok ? status(x => x.includes('ticketsim-lab') && x.includes(`${LIVE_TARGET.managementIp}/24`), ssh.text) : UNKNOWN
    checks.sshHostKey = fingerprint
    checks.sshConfig = commandStatus(sshConfig, () => true)
    checks.nginxConfig = nginxConfig.ok ? status(x => x.includes('syntax is ok') && x.includes('test is successful'), nginxConfig.stderr) : commandStatus(nginxConfig, () => false)
    checks.nginxService = nginxService.text === 'inactive' ? FAIL : nginxService.ok ? status(x => x === 'active', nginxService.text) : UNKNOWN
    for (const [name, result, expected] of [['pageHash',pageHash,LIVE_TARGET.pageSha256],['configHash',configHash,LIVE_TARGET.nginxConfigSha256],['netplanHash',netplanHash,LIVE_TARGET.netplanSha256],['cloudInitHash',cloudInitHash,LIVE_TARGET.cloudInitSha256]]) checks[name] = result.ok ? status(x => x.split(/\s+/)[0]?.toLowerCase() === expected, result.text) : UNKNOWN
    checks.sshConfigHash = sshConfigHash.ok ? status(x => x.split(/\s+/)[0]?.toLowerCase() === approval.baselineHashes.sshConfig.toLowerCase(), sshConfigHash.text) : UNKNOWN
    checks.firewallHash = firewallHash.ok ? status(x => hash(Buffer.from(`${x}\n`)) === approval.baselineHashes.firewall.toLowerCase(), firewallHash.text) : commandStatus(firewallHash, () => false)
    checks.managementRoute = managementRoute.ok ? status(x => x.includes('dev eth1') && x.includes('src 10.77.77.3'), managementRoute.text) : UNKNOWN
    checks.httpStatus = http.status === null ? UNKNOWN : http.status === 200 ? PASS : FAIL
    checks.httpContent = http.bytes === null ? UNKNOWN : http.bytes.equals(page) ? PASS : FAIL
    checks.nginxStopped = nginxService.text === 'inactive' ? PASS : nginxService.ok ? FAIL : UNKNOWN
    checks.httpUnavailable = http.refused === true ? PASS : http.status !== null ? FAIL : UNKNOWN
    if (stage === 'fault' && ssh.ok && nginxService.text === 'inactive' && http.refused === true) checks.managementAvailable = checks.managementAvailable === PASS ? PASS : checks.managementAvailable
    return { vmId: host?.targetVmId, checkpointId: host?.checkpointId, recoveryVmId: host?.recoveryVmId, protectedVmId: host?.protectedVmId, checks }
  }
  async inject() {
    const result = await this.#ssh('stopNginx')
    if (!result.ok) throw new LabError('LIVE_INJECTION_FAILED')
  }
  async claim(approval, runId) { await this.hostBridge.claim(approval,runId) }
  async reset(approval, runId) {
    await this.hostBridge.reset(approval,runId)
    // Retry read-only readiness probes only; never repeat the host reset.
    const deadline = Date.now() + 90_000
    do {
      const ssh = await this.#ssh('identity')
      const http = await this.#http()
      if (ssh.ok && ssh.text.includes('ticketsim-lab') && http.status === 200 && http.bytes?.equals(page)) return
      if (Date.now() >= deadline) break
      await delay(2000)
    } while (Date.now() < deadline)
    throw new LabError('LIVE_BOOT_READINESS_TIMEOUT')
  }
}
