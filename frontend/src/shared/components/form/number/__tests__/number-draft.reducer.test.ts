import { describe, expect, it } from 'vitest'

import { applyNumberDraftAction } from '../number-draft.reducer'
import { actionCases } from './number-draft.reducer.data'

describe('applyNumberDraftAction', () => {
  it.each(actionCases)('$name', ({ state, action, next }) => {
    expect(applyNumberDraftAction(state, action)).toEqual(next)
  })
})
