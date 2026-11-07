import { describe, expect, it } from 'vitest'

import { isTerminal, parseRunEvent } from '../run-events.utils'
import { invalidPayloadCases, terminalCases, validPayloadCases } from './run-events.utils.data'

describe('parseRunEvent', () => {
  it.each(validPayloadCases)('parses $name', ({ type, raw, data }) => {
    expect(parseRunEvent(type, '7', raw)).toEqual({ type, id: '7', data })
  })

  it.each(invalidPayloadCases)('rejects $name', ({ type, raw }) => {
    expect(parseRunEvent(type, '1', raw)).toBeNull()
  })
})

describe('isTerminal', () => {
  it.each(terminalCases)('ends the run on %s: %s', (type, ends) => {
    expect(isTerminal(type)).toBe(ends)
  })
})
