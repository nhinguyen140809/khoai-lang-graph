'use client'

import { createContext, use } from 'react'

import type { ItemPageContextValue } from '../item-page.types'

/** Given by the page of an item to its parts, so that they do not pass what it holds along. */
export const ItemPageContext = createContext<ItemPageContextValue | null>(null)

/** What the page of the item that holds this part knows. */
export function useItemPageContext(): ItemPageContextValue {
  const value = use(ItemPageContext)
  if (value === null) throw new Error('useItemPageContext needs the page of an item around it')
  return value
}
