import { describe, expect, it } from 'vitest'

import { omit } from '../object.utils'
import { omitCases } from './object.utils.data'

describe('omit', () => {
  it.each(omitCases)('drops $name', ({ record, keys, left }) => {
    expect(omit<Record<string, unknown>, string>(record, keys)).toEqual(left)
  })

  it('keeps the record it was given', () => {
    const record = { a: 1, b: 2 }

    omit(record, ['a'])

    expect(record).toEqual({ a: 1, b: 2 })
  })

  it('takes the keys from any collection, such as a set', () => {
    expect(omit({ a: 1, b: 2 }, new Set(['a' as const]))).toEqual({ b: 2 })
  })
})
