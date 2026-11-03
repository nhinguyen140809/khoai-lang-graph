import { describe, expect, it } from 'vitest'

import { distancesFrom, successorsFrom } from '../graph.utils'
import { distanceCases, edgeCases } from './graph.utils.data'

describe('distancesFrom', () => {
  it.each(distanceCases)('finds $name', ({ edges, starts, depth, expected }) => {
    const distances = distancesFrom(starts, (id) => edges[id] ?? [], depth)

    expect(Object.fromEntries(distances)).toEqual(expected)
  })
})

describe('successorsFrom', () => {
  it.each(edgeCases)('gives $name', ({ edges, id, expected }) => {
    const successorsOf = successorsFrom(
      edges,
      ({ from }) => from,
      ({ to }) => to,
    )

    expect(successorsOf(id)).toEqual(expected)
  })
})
