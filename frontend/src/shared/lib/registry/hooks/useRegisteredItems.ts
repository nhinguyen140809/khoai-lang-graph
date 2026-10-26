'use client'

import { useMemo } from 'react'

import type { OrderedItem, RegistryStore } from '../registry.types'

/** The items of a registry, from the lowest order to the highest, each with the id it registered under. */
export function useRegisteredItems<Item extends OrderedItem>(
  store: RegistryStore<Item>,
): (Item & { key: string })[] {
  const items = store((state) => state.items)

  return useMemo(
    () =>
      [...items]
        .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
        .map(([key, item]) => ({ ...item, key })),
    [items],
  )
}
