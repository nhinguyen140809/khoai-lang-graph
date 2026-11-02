import { describe, expect, it } from 'vitest'

import { artifactFilterParams, itemFilterParams } from '../filter-params.utils'
import { filterParamsCases } from './filter-params.utils.data'

describe.each([
  ['artifactFilterParams', artifactFilterParams],
  ['itemFilterParams', itemFilterParams],
])('%s', (_name, filterParams) => {
  it.each(filterParamsCases)('names the parameters for $name', ({ filters, params }) => {
    expect(filterParams(filters)).toEqual(params)
  })
})
