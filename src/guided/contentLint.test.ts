import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import guidedPublic from '../data/guided-public.json'
import type { GuidedCase } from './types'

const cases = guidedPublic as GuidedCase[]
const joinedQuantity = /(?<![\p{L}\p{N}_])(?:wa|await|r_await|w_await|Journal|PID|UID|GID|RSS|HTTP|TCP|CPU|FS|LV|VFree|Avail|Available|IFree|filesystem|Filesystem|api|đang|dùng|còn|chiếm|khoảng|hơn|hoàn thành|Đếm|đếm|đều|được|đã|tăng|qua|trong|từ|lúc|đến|tiến độ|Stopping|Local|backend|request)\d/gu
const confirmedTypos = ['ởstate', 'tươnglai', 'khoảng180ms', 'wa76%', 'VG còn49.99g', 'nr_throttled760', '%util 99%.0']

describe('D3-C2 generated learner prose', () => {
  it('does not reintroduce joined words and measurements while allowing technical identifiers', () => {
    const defects: string[] = []
    for (const guidedCase of cases) {
      const answer = JSON.parse(fs.readFileSync(`public/guided-answers/${guidedCase.id}.json`, 'utf8')) as Record<string, unknown>
      const hintFile = JSON.parse(fs.readFileSync(`public/guided-hints/${guidedCase.id}.json`, 'utf8')) as { hints: string[] }
      const prose: [string, string][] = [
        ['customerExplanation', guidedCase.customerExplanation ?? ''],
        ['verificationPrompt', guidedCase.verificationPrompt],
        ...guidedCase.probes.flatMap(probe => [[`${probe.id}.purpose`, probe.purpose], [`${probe.id}.why`, probe.why ?? ''], [`${probe.id}.meaning`, probe.meaning]] as [string, string][]),
        ...hintFile.hints.map((hint, index): [string, string] => [`hint${index + 1}`, hint]),
        ...Object.entries(answer).filter(([, value]) => typeof value === 'string').map(([name, value]): [string, string] => [`answer.${name}`, value as string]),
      ]
      for (const question of guidedCase.questions.filter(item => item.kind !== 'short_answer')) {
        const feedback = JSON.parse(fs.readFileSync(`public/guided-feedback/${guidedCase.id}/${question.id}.json`, 'utf8')) as { explanation: string; optionFeedback: Record<string, string> }
        prose.push([`${question.id}.prompt`, question.prompt], [`${question.id}.explanation`, feedback.explanation])
        prose.push(...question.options.map(option => [`${question.id}.${option.id}`, option.label] as [string, string]))
        prose.push(...Object.entries(feedback.optionFeedback).map(([id, value]) => [`${question.id}.${id}.feedback`, value] as [string, string]))
      }
      for (const [field, value] of prose) {
        const match = value.match(joinedQuantity)
        if (match) defects.push(`${guidedCase.id}/${field}: ${match.join(', ')}`)
        for (const typo of confirmedTypos) if (value.includes(typo)) defects.push(`${guidedCase.id}/${field}: ${typo}`)
      }
    }
    expect(defects).toEqual([])
  })
})
