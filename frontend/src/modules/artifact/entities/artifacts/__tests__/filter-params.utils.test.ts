import { describe, expect, it } from 'vitest'

import { filterParams } from '../filter-params.utils'
import { filterParamsCases } from './filter-params.utils.data'

describe('filterParams', () => {
  it.each(filterParamsCases)('names the parameters for $name', ({ filters, params }) => {
    expect(filterParams(filters)).toEqual(params)
  })
})
