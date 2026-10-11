import { describe, expect, it } from 'vitest'

import { rowsWithItems } from '../matrix-filter.utils'
import type { ItemRef } from '../traceability.types'

const ref = (key: string): ItemRef => ({ item_id: key, key, kind: 'k', title: key })

describe('rowsWithItems', () => {
  const rows = [
    { cells: { a: [ref('A1')], b: [ref('B1')] } },
    { cells: { a: [], b: [ref('B2'), ref('B3')] } },
    { cells: { a: [ref('A3')], b: [] } },
  ]

  it('keeps the rows with one of the items in any cell', () => {
    expect(rowsWithItems(rows, [ref('B3'), ref('A3')])).toEqual([rows[1], rows[2]])
  })

  it('keeps no row for no item', () => {
    expect(rowsWithItems(rows, [])).toEqual([])
  })
})
