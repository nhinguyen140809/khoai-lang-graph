import { describe, expect, it } from 'vitest'

import { applyHistoryViewAction } from '../history-view.reducer'
import { actionCases } from './history-view.reducer.data'

describe('applyHistoryViewAction', () => {
  it.each(actionCases)('$name', ({ state, action, next }) => {
    expect(applyHistoryViewAction(state, action)).toEqual(next)
  })
})
