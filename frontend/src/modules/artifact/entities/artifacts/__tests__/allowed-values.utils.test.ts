import { describe, expect, it } from 'vitest'

import { allowedValues } from '../allowed-values.utils'
import { allowedValuesCases } from './allowed-values.utils.data'

describe('allowedValues', () => {
  it.each(allowedValuesCases)('gives $name', ({ artifacts, allowedValuesFrom, values }) => {
    expect(allowedValues(artifacts, allowedValuesFrom)).toEqual(values)
  })
})
