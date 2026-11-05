/** The place of a value in an order, from 0; a value that is not in it comes after all of them. */
export function rankIn<T>(order: readonly T[], value: T): number {
  const index = order.indexOf(value)
  return index === -1 ? order.length : index
}

/** The value of the list that comes first in the order; undefined for an empty list. */
export function firstInOrder<T>(values: readonly T[], order: readonly T[]): T | undefined {
  return values.toSorted((first, second) => rankIn(order, first) - rankIn(order, second))[0]
}
