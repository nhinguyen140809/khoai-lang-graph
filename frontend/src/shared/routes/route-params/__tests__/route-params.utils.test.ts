import { describe, expect, it } from 'vitest'

import { nextParam } from '../route-params.utils'
import { nextParamCases } from './route-params.utils.data'

describe('nextParam', () => {
  it.each(nextParamCases)('reads $name of next', ({ query, next }) => {
    expect(nextParam(query)).toBe(next)
  })
})
