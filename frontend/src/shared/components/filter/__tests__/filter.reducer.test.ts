import { describe, expect, it } from 'vitest'

import { applyFilterAction } from '../filter.reducer'
import { actionCases } from './filter.reducer.data'

describe('applyFilterAction', () => {
  it.each(actionCases)('$name', ({ values, action, next }) => {
    expect(applyFilterAction(values, action)).toEqual(next)
  })
})
