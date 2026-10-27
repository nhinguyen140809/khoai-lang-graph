import { expect, it } from 'vitest'

import type { DistinctQueryKeysCase, NestedQueryKeyCase } from './query-key.types'

/**
 * Tests that each query key starts with the wider key of its factory, so that a query client
 * given the wider key loads again every query below it.
 */
export function itNestsQueryKeys(cases: readonly NestedQueryKeyCase[]) {
  it.each(cases)('starts the key of $name with the key above it', ({ key, wider }) => {
    expect(key.slice(0, wider.length)).toEqual(wider)
  })
}

/** Tests that each pair of query keys differs. */
export function itTellsQueryKeysApart(cases: readonly DistinctQueryKeysCase[]) {
  it.each(cases)('tells $name apart', ({ first, second }) => {
    expect(first).not.toEqual(second)
  })
}
