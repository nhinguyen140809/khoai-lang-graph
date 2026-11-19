'use client'

import { useMemo } from 'react'

import type { OrderedItem, RegisteredItemsOptions, RegistryStore } from '../registry.types'

// No filter: every item stays. A constant, so that the list of items stays the same between renders.
const noFilters: readonly never[] = []

/**
 * The items of a registry, from the lowest order to the highest, each with the id it registered
 * under. `options.filters` keeps only the items that every filter accepts, such as those of one
 * side of a bar.
 */
export function useRegisteredItems<Item extends OrderedItem>(
  store: RegistryStore<Item>,
  { filters = noFilters }: RegisteredItemsOptions<Item> = {},
): (Item & { key: string })[] {
  const items = store((state) => state.items)

  return useMemo(
    () =>
      [...items]
        .filter(([, item]) => filters.every((accepts) => accepts(item)))
        .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
        .map(([key, item]) => ({ ...item, key })),
    [items, filters],
  )
}
