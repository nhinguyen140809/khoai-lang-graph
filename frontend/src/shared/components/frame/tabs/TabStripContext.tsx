'use client'

import { createContext } from 'react'

import type { EditorTab } from './editor-tabs.schema'

/** The tab strip of a group: what `useEditorTabs` gives, shared with the tabs and the menu. */
export interface TabStrip {
  /** The open tabs, in the order of the strip. */
  tabs: EditorTab[]
  /** The id of the tab whose page is on screen. */
  onScreen: string | undefined
  /** The id of the preview tab, which the next page opened replaces. */
  previewId: string | undefined
  /** Keeps the preview tab `id` open. */
  keep: (id: string) => void
  /** Closes the tabs `ids`; closing the tab on screen shows the tab next to it. */
  close: (ids: readonly string[]) => void
}

/** The strip that `EditorTabs` renders, and `useTabStrip` reads inside it. */
export const TabStripContext = createContext<TabStrip | null>(null)
