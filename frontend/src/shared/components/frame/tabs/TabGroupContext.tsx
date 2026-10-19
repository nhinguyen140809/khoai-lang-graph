'use client'

import { createContext } from 'react'

/**
 * The tab group of the workspace around a page, in which `useEditorTab` opens the tab of the page.
 * The layout names the group. Null outside a workspace with tabs, where a page opens no tab.
 */
export const TabGroupContext = createContext<string | null>(null)
