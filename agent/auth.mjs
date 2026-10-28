import { randomBytes, timingSafeEqual } from 'node:crypto'
import { LabError } from './errors.mjs'

function sameSecret(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false
  const a = Buffer.from(left); const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export class PairingManager {
  constructor({ pairingCode = randomBytes(24).toString('base64url'), now = () => Date.now(), pairingTtlMs = 5 * 60_000, sessionTtlMs = 15 * 60_000 } = {}) {
    this.pairingCode = pairingCode
    this.now = now
    this.pairingExpiresAt = now() + pairingTtlMs
    this.sessionTtlMs = sessionTtlMs
    this.session = null
    this.paired = false
  }
  pair(code) {
    if (this.paired || this.now() >= this.pairingExpiresAt || !sameSecret(code, this.pairingCode)) throw new LabError('PAIRING_DENIED', 401)
    this.paired = true
    this.pairingCode = null
    const token = randomBytes(32).toString('base64url')
    this.session = { token, expiresAt: this.now() + this.sessionTtlMs }
    return { token, expiresAt: new Date(this.session.expiresAt).toISOString() }
  }
  authorize(header) {
    const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : ''
    if (!this.session || this.now() >= this.session.expiresAt || !sameSecret(token, this.session.token)) throw new LabError('UNAUTHORIZED', 401)
  }
}
