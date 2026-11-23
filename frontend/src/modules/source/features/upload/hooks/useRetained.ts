import { useState } from 'react'

/**
 * The items as they were the last time there were any: while the list is empty the last items stay,
 * so that what shows them can play its exit before it goes.
 */
export function useRetained<T>(items: readonly T[]): readonly T[] {
  const [retained, setRetained] = useState(items)
  if (items.length > 0 && items !== retained) setRetained(items)
  return items.length > 0 ? items : retained
}
