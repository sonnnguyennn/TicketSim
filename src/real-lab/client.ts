let csrf = ''
const base = location.protocol === 'https:' ? '/api/v1' : 'http://127.0.0.1:4174/api/v1'
export async function labRequest(path: string, body?: object, requestKey?: string) {
  const response = await fetch(`${base}${path}`, { method: body === undefined ? 'GET' : 'POST', credentials: 'include', cache: 'no-store',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-TicketSim-CSRF': csrf, ...(requestKey ? { 'Idempotency-Key': requestKey } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  const data = await response.json()
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : `HTTP ${response.status}`)
  if (typeof data.csrf === 'string') csrf = data.csrf
  return data
}
export function actionKey(purpose: string) {
  const name = `ticketsim-web-action:${purpose}`
  const prior = sessionStorage.getItem(name)
  if (prior) return prior
  const value = crypto.randomUUID().replaceAll('-', '')
  sessionStorage.setItem(name, value)
  return value
}
