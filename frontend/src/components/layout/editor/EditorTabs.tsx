'use client'

import { FileIcon, XIcon } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useActivities } from '../activity-bar/ActivitiesContext'
import { activityOfHref } from '../activity-bar/activity.utils'
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
 * click or the close button closes a tab; the close button shows on the active tab and on the tab
 * under the pointer. The strip remembers the page on screen, so that a tab a page opens goes next
 * to the tab of that page.
 */
export function EditorTabs({ group, rootHref }: EditorTabsProps) {
  const pathname = usePathname()
  const router = useRouter()
  const tabs = useEditorTabsStore((state) => state.groups[group]) ?? noTabs
  const closeTab = useEditorTabsStore((state) => state.closeTab)
  const setLastHref = useEditorTabsStore((state) => state.setLastHref)

  useEffect(() => {
    setLastHref(group, pathname)
  }, [group, pathname, setLastHref])

  if (tabs.length === 0) return null

  const close = (tab: EditorTab) => {
    const next = neighborTab(tabs, tab.id)?.href ?? rootHref
    if (tab.href === pathname && next !== undefined) router.push(next as Route)
    closeTab(group, tab.id)
  }

  return (
    <nav
      aria-label="Open editors"
      className="flex h-9 shrink-0 scrollbar-none overflow-x-auto border-b bg-sidebar"
    >
      <ul className="flex">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            tab={tab}
            active={tab.href === pathname}
            onClose={() => {
              close(tab)
            }}
          />
        ))}
      </ul>
    </nav>
  )
}

interface TabProps {
  tab: EditorTab
  /** The tab of the page on screen. */
  active: boolean
  onClose: () => void
}

/** A link to the page of the tab, and a close button; a middle click closes the tab too. */
function Tab({ tab, active, onClose }: TabProps) {
  return (
    <li
      data-active={active}
      className="group/tab relative flex items-center border-r text-xs data-[active=false]:text-muted-foreground data-[active=false]:hover:bg-sidebar-accent/60 data-[active=false]:hover:text-foreground data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:before:absolute data-[active=true]:before:inset-x-0 data-[active=true]:before:top-0 data-[active=true]:before:h-px data-[active=true]:before:bg-primary"
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
        className="flex h-full max-w-56 items-center gap-1.5 pr-1 pl-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        <TabIcon tab={tab} />
        <span className="truncate">{tab.title}</span>
      </Link>
      <CloseTabButton title={tab.title} onClick={onClose} />
    </li>
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
      className="flex shrink-0 group-data-[active=true]/tab:text-primary [&_svg]:size-3.5"
    >
      {icon}
    </span>
  )
}

interface CloseTabButtonProps {
  title: string
  onClick: () => void
}

/** Shown on the active tab, on the tab under the pointer, and when it has the focus. */
function CloseTabButton({ title, onClick }: CloseTabButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Close ${title}`}
      onClick={onClick}
      className="mr-1 flex size-5 items-center justify-center rounded-sm opacity-0 outline-none group-hover/tab:opacity-100 group-data-[active=true]/tab:opacity-100 hover:bg-muted focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <XIcon aria-hidden className="size-3" />
    </button>
  )
}
