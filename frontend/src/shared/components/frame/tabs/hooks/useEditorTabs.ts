import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import type { EditorTab } from '../editor-tabs.schema'
import { useEditorTabsStore } from '../editor-tabs.store'
import { neighborTab } from '../editor-tabs.utils'
import type { TabStrip } from './useTabStrip'

const noTabs: EditorTab[] = []

/**
 * The tab strip of a group: its tabs, the tab whose page is on screen, the preview tab, and the
 * actions of the strip. Closing the tab on screen shows the tab next to it that stays open, else
 * `rootHref`: the start page of the feature whose side panel is shown.
 */
export function useEditorTabs(group: string, rootHref: Route | undefined): TabStrip {
  const router = useRouter()
  const tabs = useEditorTabsStore((state) => state.groups[group]) ?? noTabs
  const onScreen = useEditorTabsStore((state) => state.onScreen[group])
  const previewId = useEditorTabsStore((state) => state.preview[group])
  const keepTab = useEditorTabsStore((state) => state.keepTab)
  const closeTabs = useEditorTabsStore((state) => state.closeTabs)

  return {
    tabs,
    onScreen,
    previewId,
    keep: (id: string) => {
      keepTab(group, id)
    },
    close: (closing: readonly string[]) => {
      if (onScreen !== undefined && closing.includes(onScreen)) {
        const next = neighborTab(tabs, onScreen, closing)?.href ?? rootHref
        if (next !== undefined) router.push(next as Route)
      }
      closeTabs(group, closing)
    },
  }
}
