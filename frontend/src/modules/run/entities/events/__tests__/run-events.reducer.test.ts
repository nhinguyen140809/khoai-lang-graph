import { describe, expect, it } from 'vitest'

import {
  applyRunEvent,
  initialRunStreamState,
  isTerminal,
  parseRunEvent,
} from '../run-events.reducer'
import {
  invalidPayloadCases,
  runEventCases,
  terminalCases,
  validPayloadCases,
} from './run-events.reducer.data'

describe('applyRunEvent', () => {
  it.each(runEventCases)('$name', ({ events, state }) => {
    expect(events.reduce(applyRunEvent, initialRunStreamState)).toMatchObject(state)
  })
})

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
