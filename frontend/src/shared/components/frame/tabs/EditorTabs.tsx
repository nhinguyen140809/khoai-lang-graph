'use client'

import { ChevronDownIcon, FileIcon, XIcon } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

import { useActivities } from '../activities/ActivitiesContext'
import { activityOfHref } from '../activities/activity.utils'
import { type EditorTab, neighborTab, useEditorTabsStore } from './editor-tabs.store'

interface EditorTabsProps {
  group: string
  /** Shown after the last tab is closed: the start page of the feature whose side panel is shown. */
  rootHref: Route | undefined
}

const noTabs: EditorTab[] = []

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
  const router = useRouter()
  const tabs = useEditorTabsStore((state) => state.groups[group]) ?? noTabs
  const onScreen = useEditorTabsStore((state) => state.onScreen[group])
  const previewId = useEditorTabsStore((state) => state.preview[group])
  const closeTabs = useEditorTabsStore((state) => state.closeTabs)
  const keepTab = useEditorTabsStore((state) => state.keepTab)

  if (tabs.length === 0) return null

  const ids = tabs.map(({ id }) => id)
  // When the tab on screen closes, the tab next to it that stays open is shown instead.
  const close = (closing: readonly string[]) => {
    if (onScreen !== undefined && closing.includes(onScreen)) {
      const next = neighborTab(tabs, onScreen, closing)?.href ?? rootHref
      if (next !== undefined) router.push(next as Route)
    }
    closeTabs(group, closing)
  }

  return (
    <nav aria-label="Open editors" className="flex h-10 shrink-0 border-b bg-sidebar">
      <ul className="flex min-w-0 flex-1 scrollbar-none overflow-x-auto">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            tab={tab}
            active={tab.id === onScreen}
            preview={tab.id === previewId}
            alone={tabs.length === 1}
            onKeep={() => {
              keepTab(group, tab.id)
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

interface TabProps {
  tab: EditorTab
  /** The tab of the page on screen. */
  active: boolean
  /** The preview tab of the group, which the next page opened replaces. */
  preview: boolean
  /** The only open tab, so its menu has no other tabs to close. */
  alone: boolean
  onKeep: () => void
  onClose: () => void
  onCloseOthers: () => void
  onCloseAll: () => void
}

/**
 * A link to the page of the tab, a close button, and the menu of the tab. A middle click closes
 * the tab too, and a double click keeps a preview tab.
 */
function Tab({
  tab,
  active,
  preview,
  alone,
  onKeep,
  onClose,
  onCloseOthers,
  onCloseAll,
}: TabProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <li
          data-active={active}
          data-preview={preview}
          className="group/tab relative flex shrink-0 items-center border-r text-sm data-[active=false]:text-muted-foreground data-[active=false]:hover:bg-sidebar-accent/60 data-[active=false]:hover:text-foreground data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:before:absolute data-[active=true]:before:inset-x-0 data-[active=true]:before:top-0 data-[active=true]:before:h-px data-[active=true]:before:bg-primary"
        >
          <Link
            href={tab.href as Route}
            aria-current={active ? 'page' : undefined}
            title={tab.title}
            onAuxClick={(event) => {
              if (event.button !== 1) return
              event.preventDefault()
              onClose()
            }}
            onDoubleClick={onKeep}
            className="flex h-full max-w-56 items-center gap-1.5 pr-1 pl-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <TabLabel tab={tab} preview={preview} />
          </Link>
          <CloseTabButton title={tab.title} onClick={onClose} />
        </li>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem disabled={!preview} onSelect={onKeep}>
          Keep open
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onClose}>Close</ContextMenuItem>
        <ContextMenuItem disabled={alone} onSelect={onCloseOthers}>
          Close other tabs
        </ContextMenuItem>
        <ContextMenuItem onSelect={onCloseAll}>Close all tabs</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

interface OpenTabsMenuProps {
  tabs: EditorTab[]
  onScreen: string | undefined
  previewId: string | undefined
  onCloseAll: () => void
}

/** The button at the end of the strip: a menu of every open tab, then closing them all. */
function OpenTabsMenu({ tabs, onScreen, previewId, onCloseAll }: OpenTabsMenuProps) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="All open tabs"
          className="mx-1 flex size-8 shrink-0 items-center justify-center self-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ChevronDownIcon aria-hidden className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {tabs.map((tab) => (
          <DropdownMenuItem
            key={tab.id}
            data-active={tab.id === onScreen}
            data-preview={tab.id === previewId}
            aria-current={tab.id === onScreen ? 'page' : undefined}
            onSelect={() => {
              router.push(tab.href as Route)
            }}
            className="group/tab"
          >
            <TabLabel tab={tab} preview={tab.id === previewId} />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onCloseAll}>Close all tabs</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * The icon and the title of a tab, on the tab and in the list of open tabs. Inside an element of
 * the group `tab`, `data-active` colors the icon and `data-preview` sets the title in italics.
 */
function TabLabel({ tab, preview }: { tab: EditorTab; preview: boolean }) {
  return (
    <>
      <TabIcon tab={tab} />
      <span className="truncate group-data-[preview=true]/tab:italic">{tab.title}</span>
      {preview && <span className="sr-only">, preview</span>}
    </>
  )
}

/** The icon that the page of the tab names, else the icon of the feature it belongs to. */
function TabIcon({ tab }: { tab: EditorTab }) {
  const { activities, tabIcons } = useActivities()
  const named = tab.icon === undefined ? undefined : tabIcons[tab.icon]
  const icon = named ?? activityOfHref(activities, tab.href)?.icon ?? <FileIcon />

  return (
    <span
      aria-hidden
      className="flex shrink-0 group-data-[active=true]/tab:text-primary [&_svg]:size-4"
    >
      {icon}
    </span>
  )
}

interface CloseTabButtonProps {
  title: string
  onClick: () => void
}

/** The close button of a tab, shown on every tab, so that closing never needs the pointer over it. */
function CloseTabButton({ title, onClick }: CloseTabButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Close ${title}`}
      onClick={onClick}
      className="mr-1 flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <XIcon aria-hidden className="size-3.5" />
    </button>
  )
}
