import type { ItemRef, Matrix } from './traceability.types'

/** The rows with at least one of the items, in any of their cells. */
export function rowsWithItems(rows: Matrix['rows'], items: ItemRef[]): Matrix['rows'] {
  const wanted = new Set(items.map(({ item_id }) => item_id))
  return rows.filter(({ cells }) =>
    Object.values(cells).some((cell) => cell.some(({ item_id }) => wanted.has(item_id))),
  )
}
