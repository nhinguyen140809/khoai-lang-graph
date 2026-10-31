import { describe, expect, it } from 'vitest'

import { validateNewThread, validateThreadChange } from '../threads.validators'
import {
  newThreadCases,
  newThreadProblemCases,
  threadChangeCases,
  threadChangeProblemCases,
} from './threads.validators.data'

describe('validateNewThread', () => {
  it.each(newThreadCases)('reads $name', ({ body, title }) => {
    expect(validateNewThread(body)).toEqual({ title })
  })

  it.each(newThreadProblemCases)('refuses $name', ({ body, field }) => {
    expect(validateNewThread(body)).toEqual({ problems: [expect.objectContaining({ field })] })
  })
})

describe('validateThreadChange', () => {
  it.each(threadChangeCases)('reads $name', ({ body, change }) => {
    expect(validateThreadChange(body)).toEqual({ change })
  })

  it.each(threadChangeProblemCases)('refuses $name', ({ body, field }) => {
    expect(validateThreadChange(body)).toEqual({ problems: [expect.objectContaining({ field })] })
  })
})
