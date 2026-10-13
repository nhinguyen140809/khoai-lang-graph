'use client'

import type { Route } from 'next'

import { useEditorTabs } from '../hooks/useEditorTabs'
import { OpenTabsMenu } from './OpenTabsMenu'
import { TabItem } from './TabItem'

interface EditorTabsProps {
  group: string
  /** Shown after the last tab is closed: the start page of the feature whose side panel is shown. */
  rootHref: Route | undefined
}

/**
 * The open editors of a project, whichever feature they belong to. A tab shows the icon its page
 * names among the tab icons of the frame, else the icon of the feature it belongs to. A middle
 * click or the close button closes a tab; every tab shows its close button. The active tab is the
 * one that the page on screen opened with `useEditorTab`. The preview tab, which the next page
 * opened replaces, has its title in italics; a double click on it keeps it.
 *
 * A right click or the menu key on a tab opens its menu: keep it, close it, close the others, or
 * close them all. The button at the end of the strip lists every open tab, for a strip too long
 * to show them all.
 */
export function EditorTabs({ group, rootHref }: EditorTabsProps) {
  const { tabs, onScreen, previewId, keep, close } = useEditorTabs(group, rootHref)

  if (tabs.length === 0) return null

  const ids = tabs.map(({ id }) => id)

  return (
    <nav aria-label="Open editors" className="flex h-10 shrink-0 border-b bg-sidebar">
      <ul className="flex min-w-0 flex-1 scrollbar-none overflow-x-auto">
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            active={tab.id === onScreen}
            preview={tab.id === previewId}
            alone={tabs.length === 1}
            onKeep={() => {
              keep(tab.id)
            }}
            onClose={() => {
              close([tab.id])
            }}
            onCloseOthers={() => {
              close(ids.filter((id) => id !== tab.id))
            }}
            onCloseAll={() => {
              close(ids)
            }}
          />
        ))}
      </ul>
      <OpenTabsMenu
        tabs={tabs}
        onScreen={onScreen}
        previewId={previewId}
        onCloseAll={() => {
          close(ids)
        }}
      />
    </nav>
  )
}
