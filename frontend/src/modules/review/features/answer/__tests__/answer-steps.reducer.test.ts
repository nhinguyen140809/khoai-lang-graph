import { describe, expect, it } from 'vitest'

import { applyAnswerStepsAction } from '../answer-steps.reducer'
import { actionCases } from './answer-steps.reducer.data'

describe('applyAnswerStepsAction', () => {
  it.each(actionCases)('$name', ({ state, action, next }) => {
    expect(applyAnswerStepsAction(state, action)).toEqual(next)
  })
})
