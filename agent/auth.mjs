import { randomBytes, timingSafeEqual } from 'node:crypto'
import { LabError } from './errors.mjs'

function sameSecret(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false
  const a = Buffer.from(left); const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export class PairingManager {
  constructor({ pairingCode = randomBytes(24).toString('base64url'), now = () => Date.now(), pairingTtlMs = 5 * 60_000, sessionTtlMs = 15 * 60_000, absoluteTtlMs = 2 * 60 * 60_000 } = {}) {
    this.pairingCode = pairingCode
    this.now = now
    this.pairingExpiresAt = now() + pairingTtlMs
    this.sessionTtlMs = sessionTtlMs
    this.absoluteTtlMs = absoluteTtlMs
    this.session = null
    this.paired = false
  }
  pair(code) {
    if (this.paired || this.now() >= this.pairingExpiresAt || !sameSecret(code, this.pairingCode)) throw new LabError('PAIRING_DENIED', 401)
    this.paired = true
    this.pairingCode = null
    const token = randomBytes(32).toString('base64url')
    this.session = { token, owner: randomBytes(16).toString('hex'), csrf: randomBytes(24).toString('base64url'), expiresAt: this.now() + this.sessionTtlMs, absoluteExpiresAt: this.now() + this.absoluteTtlMs }
    return { token, expiresAt: new Date(this.session.expiresAt).toISOString() }
  }
  authorize(header) {
    const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : ''
    if (!this.session || this.now() >= this.session.expiresAt || !sameSecret(token, this.session.token)) throw new LabError('UNAUTHORIZED', 401)
    return this.session
  }
  renew(header) {
    const session = this.authorize(header)
    session.expiresAt = Math.min(this.now() + this.sessionTtlMs, session.absoluteExpiresAt)
    return { expiresAt: new Date(session.expiresAt).toISOString(), csrf: session.csrf }
  }
  reissuePairing() {
    if (this.session && this.now() < this.session.expiresAt) throw new LabError('SESSION_STILL_ACTIVE', 409)
    this.pairingCode = randomBytes(24).toString('base64url'); this.paired = false
    this.pairingExpiresAt = this.now() + 5 * 60_000
    return this.pairingCode
  }
}
