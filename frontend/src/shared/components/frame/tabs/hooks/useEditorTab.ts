import { useCallback, useEffect } from 'react'

import type { EditorTab } from '../editor-tabs.schema'
import { useEditorTabsStore } from '../editor-tabs.store'

/**
 * Opens a tab for the page that calls it, next to the tab shown last, or updates its title. While
 * the page is on screen, its tab is the active one, whatever the address of the page holds. Pass
 * `null` while the title is not known yet.
 *
 * The tab opens as the preview tab of its group, which the next page opened replaces, unless the
 * page was asked to be kept with `keepPage`. The function returned keeps the tab: the page calls it
 * when the user changes something on it.
 */
export function useEditorTab(group: string, tab: EditorTab | null): () => void {
  const openTab = useEditorTabsStore((state) => state.openTab)
  const keepTab = useEditorTabsStore((state) => state.keepTab)
  const leaveTab = useEditorTabsStore((state) => state.leaveTab)
  const id = tab?.id
  const title = tab?.title
  const href = tab?.href
  const icon = tab?.icon

  useEffect(() => {
    if (id === undefined || title === undefined || href === undefined) return
    openTab(group, { id, title, href, ...(icon !== undefined && { icon }) })
  }, [group, id, title, href, icon, openTab])

  useEffect(() => {
    if (id === undefined) return
    return () => {
      leaveTab(group, id)
    }
  }, [group, id, leaveTab])

  return useCallback(() => {
    if (id !== undefined) keepTab(group, id)
  }, [group, id, keepTab])
}
