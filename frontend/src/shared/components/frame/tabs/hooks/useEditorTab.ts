'use client'

import { useCallback, useEffect } from 'react'

import { useEditorTabsStore } from '../editor-tabs.store'
import type { EditorTab } from '../editor-tabs.types'
import { useTabGroup } from './useTabGroup'

/**
 * Opens a tab for the page that calls it, in the tab group of the workspace around the page, next
 * to the tab shown last, or updates its title. While the page is on screen, its tab is the active
 * one, whatever the address of the page holds. Pass `null` while the title is not known yet.
 * Outside a workspace with tabs, the page opens no tab.
 *
 * The tab opens as the preview tab of its group, which the next page opened replaces, unless the
 * page was asked to be kept with `keepPage`. The function returned keeps the tab: the page calls it
 * when the user changes something on it.
 *
 * A page that shows a state of its own while it loads or fails opens its tab at once with a stand-in
 * title and sets `isTitleProvisional`: a tab that is already open keeps the title it has.
 */
export function useEditorTab(
  tab: EditorTab | null,
  { isTitleProvisional = false }: { isTitleProvisional?: boolean } = {},
): () => void {
  const group = useTabGroup()
  const openTab = useEditorTabsStore((state) => state.openTab)
  const keepTab = useEditorTabsStore((state) => state.keepTab)
  const leaveTab = useEditorTabsStore((state) => state.leaveTab)
  const id = tab?.id
  const title = tab?.title
  const href = tab?.href
  const icon = tab?.icon

  useEffect(() => {
    if (group === null || id === undefined || title === undefined || href === undefined) return
    openTab(group, { id, title, href, ...(icon !== undefined && { icon }) }, { isTitleProvisional })
  }, [group, id, title, href, icon, isTitleProvisional, openTab])

  useEffect(() => {
    if (group === null || id === undefined) return
    return () => {
      leaveTab(group, id)
    }
  }, [group, id, leaveTab])

  return useCallback(() => {
    if (group !== null && id !== undefined) keepTab(group, id)
  }, [group, id, keepTab])
}
