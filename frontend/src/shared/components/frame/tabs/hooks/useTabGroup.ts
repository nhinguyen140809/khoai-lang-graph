'use client'

import { createContext, useContext } from 'react'

/**
 * The tab group of the workspace around a page, in which `useEditorTab` opens the tab of the page.
 * The layout names the group, and `useTabGroup` reads it. Null outside a workspace with tabs,
 * where a page opens no tab.
 */
export const TabGroupContext = createContext<string | null>(null)

/**
 * The tab group of the workspace around the caller, which the layout names. Null outside a
 * workspace with tabs.
 */
export function useTabGroup(): string | null {
  return useContext(TabGroupContext)
}
