import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { neighborTab, useEditorTabsStore } from '../editor-tabs.store'

/**
 * Closes tabs of the group. When the tab on screen closes, the tab next to it that stays open is
 * shown instead, else `rootHref`: the start page of the feature whose side panel is shown.
 */
export function useCloseTabs(group: string, rootHref: Route | undefined) {
  const router = useRouter()
  const tabs = useEditorTabsStore((state) => state.groups[group])
  const onScreen = useEditorTabsStore((state) => state.onScreen[group])
  const closeTabs = useEditorTabsStore((state) => state.closeTabs)

  return (closing: readonly string[]) => {
    if (onScreen !== undefined && closing.includes(onScreen)) {
      const next = neighborTab(tabs ?? [], onScreen, closing)?.href ?? rootHref
      if (next !== undefined) router.push(next as Route)
    }
    closeTabs(group, closing)
  }
}
