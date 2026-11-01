import { LabError } from './errors.mjs'

export class OperatorBridge {
  constructor({ token, endpoint = 'http://127.0.0.1:4175', fetcher = fetch } = {}) {
    if (typeof token !== 'string' || token.length < 32 || endpoint !== 'http://127.0.0.1:4175') throw new LabError('OPERATOR_BRIDGE_NOT_CONFIGURED')
    this.token = token; this.endpoint = endpoint; this.fetcher = fetcher
  }
  async #call(operationId, approval, runId = null) {
    const response = await this.fetcher(`${this.endpoint}/v1/action`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
      body: JSON.stringify({ operationId, approvalId: approval.approvalId, runId }), signal: AbortSignal.timeout(operationId === 'real-host-reset-v1' ? 240_000 : 60_000),
    })
    if (!response.ok) throw new LabError('OPERATOR_ACTION_FAILED')
    const body = await response.json()
    if (body?.operationId !== operationId || body?.approvalId !== approval.approvalId || body?.outcome !== 'pass') throw new LabError('OPERATOR_RESPONSE_INVALID')
    return body.observation
  }
  inspect(approval) { return this.#call('real-host-inspect-v1', approval) }
  claim(approval, runId) { return this.#call('real-host-claim-v1', approval, runId) }
  reset(approval, runId) { return this.#call('real-host-reset-v1', approval, runId) }
}
