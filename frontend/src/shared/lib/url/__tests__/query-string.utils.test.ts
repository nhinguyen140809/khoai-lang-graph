import { describe, expect, it } from 'vitest'

import { queryString, queryStringOf } from '../query-string.utils'
import { queryStringCases, queryStringOfCases } from './query-string.utils.data'

describe('queryString', () => {
  it.each(queryStringCases)('makes $query from $name', ({ params, query }) => {
    expect(queryString(params)).toBe(query)
  })
})

describe('queryStringOf', () => {
  it.each(queryStringOfCases)(
    'writes $queryString for $name',
    ({ query, queryString: expected }) => {
      expect(queryStringOf(new URLSearchParams(query))).toBe(expected)
    },
  )
})
