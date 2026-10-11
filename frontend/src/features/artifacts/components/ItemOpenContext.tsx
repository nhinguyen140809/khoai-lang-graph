'use client'

import { createContext, useContext } from 'react'

/**
 * When an artifact or an item is drawn inside another view, such as the review, a click on an item
 * asks that view to show the item instead of leaving for the page of the item.
 */
export const ItemOpenContext = createContext<((itemId: string) => void) | null>(null)

export function useItemOpen() {
  return useContext(ItemOpenContext)
}
