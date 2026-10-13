import { useEffect } from 'react'

import { type EditorTab, useEditorTabsStore } from '../editor-tabs.store'

/**
 * Opens a tab for the page that calls it, next to the tab shown last, or updates its title. While
 * the page is on screen, its tab is the active one, whatever the address of the page holds. Pass
 * `null` while the title is not known yet.
 *
 * @returns `close`, which closes the tab of the page, such as when the page has nothing left to
 * show.
 */
export function useEditorTab(group: string, tab: EditorTab | null) {
  const openTab = useEditorTabsStore((state) => state.openTab)
  const leaveTab = useEditorTabsStore((state) => state.leaveTab)
  const closeTab = useEditorTabsStore((state) => state.closeTab)
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

  return {
    close: () => {
      if (id !== undefined) closeTab(group, id)
    },
  }
}
