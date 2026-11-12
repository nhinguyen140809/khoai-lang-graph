'use client'

import type { Route } from 'next'

import { useHasPainted, useLeavingRows } from '@/shared/lib/animation'

import { tabLeaveMs } from '../editor-tabs.constants'
import { useEditorTabs } from '../hooks/useEditorTabs'
import { useTabGroup } from '../hooks/useTabGroup'
import { TabStripContext } from '../hooks/useTabStrip'
import { OpenTabsMenu } from './OpenTabsMenu'
import { TabItem } from './TabItem'

interface EditorTabsProps {
  /** Shown after the last tab is closed: the start page of the feature whose side panel is shown. */
  rootHref: Route | undefined
}

/**
 * The open editors of a tab group, whichever feature they belong to. A tab shows the icon its page
 * names among the tab icons of the frame, else the icon of the feature it belongs to. A middle
 * click or the close button closes a tab; every tab shows its close button. The active tab is the
 * one that the page on screen opened with `useEditorTab`. The preview tab, which the next page
 * opened replaces, has its title in italics; a double click on it keeps it.
 *
 * A right click or the menu key on a tab opens its menu: keep it, close it, close the others, or
 * close them all. The button at the end of the strip lists every open tab, for a strip too long
 * to show them all.
 *
 * The group is the one of the workspace around the strip; outside a workspace with tabs, there is
 * no strip.
 */
export function EditorTabs({ rootHref }: EditorTabsProps) {
  const group = useTabGroup()
  if (group === null) return null
  return <GroupTabs group={group} rootHref={rootHref} />
}

interface GroupTabsProps extends EditorTabsProps {
  group: string
}

/** The strip of one tab group, once the group has a tab. */
function GroupTabs({ group, rootHref }: GroupTabsProps) {
  const strip = useEditorTabs(group, rootHref)
  // A tab that closes or is replaced stays a moment longer and folds up, while the tab that takes
  // its place grows; the tabs of the first render come in at once.
  const rows = useLeavingRows(strip.tabs, (tab) => tab.id, tabLeaveMs)
  const isReady = useHasPainted()

  if (strip.tabs.length === 0) return null

  return (
    <TabStripContext value={strip}>
      <nav aria-label="Open editors" className="flex h-10 shrink-0 border-b bg-sidebar">
        <ul className="flex min-w-0 flex-1 scrollbar-none overflow-x-auto">
          {rows.map(({ row: tab, isLeaving }) => (
            <TabItem key={tab.id} tab={tab} isLeaving={isLeaving} isStripReady={isReady} />
          ))}
        </ul>
        <OpenTabsMenu />
      </nav>
    </TabStripContext>
  )
}
