import { describe, expect, it } from 'vitest'

import { pathParam } from '../path-param.utils'
import { pathParamCases } from './path-param.utils.data'

describe('pathParam', () => {
  it.each(pathParamCases)('reads $name', ({ params, param, value }) => {
    expect(pathParam(params, param)).toBe(value)
  })
})
