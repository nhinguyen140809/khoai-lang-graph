import { useEffect, useState } from 'react'

import { type EditorTab, useEditorTabsStore } from '../editor-tabs.store'

/**
 * Opens a tab for the page that calls it, next to the tab of the page shown before, or updates
 * its title. Pass `null` while the title is not known yet.
 */
export function useEditorTab(group: string, tab: EditorTab | null) {
  const openTab = useEditorTabsStore((state) => state.openTab)
  // The page shown before this one, read while this page renders for the first time: the tab strip
  // records the new page in an effect, and the title of the page may come in a later render.
  const [after] = useState(() => useEditorTabsStore.getState().lastHrefs[group])
  const id = tab?.id
  const title = tab?.title
  const href = tab?.href
  const icon = tab?.icon

  useEffect(() => {
    if (id === undefined || title === undefined || href === undefined) return
    openTab(group, { id, title, href, ...(icon !== undefined && { icon }) }, { after })
  }, [group, id, title, href, icon, after, openTab])
}
