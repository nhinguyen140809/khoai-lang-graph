import { useEffect } from 'react'

import { type EditorTab, useEditorTabsStore } from '../editor-tabs.store'

/**
 * Opens a tab for the page that calls it, next to the tab of the page shown before, or updates
 * its title. Pass `null` while the title is not known yet.
 */
export function useEditorTab(group: string, tab: EditorTab | null) {
  const openTab = useEditorTabsStore((state) => state.openTab)
  const id = tab?.id
  const title = tab?.title
  const href = tab?.href
  const icon = tab?.icon

  useEffect(() => {
    if (id === undefined || title === undefined || href === undefined) return
    // The page shown before is still the last one of the group: the ProjectWorkspace records the
    // new page after its children have run their effects.
    const after = useEditorTabsStore.getState().lastHrefs[group]
    openTab(group, { id, title, href, ...(icon !== undefined && { icon }) }, { after })
  }, [group, id, title, href, icon, openTab])
}
