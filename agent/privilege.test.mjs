import { expect, it } from 'vitest'
import { assertNonAdmin } from './privilege.mjs'

it('refuses an elevated ordinary agent', () => {
  expect(() => assertNonAdmin({platform:'win32',run:()=> 'True\r\n'})).toThrow('LOCAL_AGENT_MUST_NOT_BE_ADMIN')
  expect(() => assertNonAdmin({platform:'win32',run:()=> 'False\r\n'})).not.toThrow()
  expect(() => assertNonAdmin({platform:'linux',uid:0})).toThrow('LOCAL_AGENT_MUST_NOT_BE_ROOT')
})
