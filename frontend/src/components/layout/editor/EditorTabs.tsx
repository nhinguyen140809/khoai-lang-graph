'use client'

import { FileIcon, XIcon } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'

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
 * under the pointer.
 */
export function EditorTabs({ group, rootHref }: EditorTabsProps) {
  const pathname = usePathname()
  const router = useRouter()
  const tabs = useEditorTabsStore((state) => state.groups[group]) ?? noTabs
  const closeTab = useEditorTabsStore((state) => state.closeTab)
  const { activities, tabIcons } = useActivities()

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
        {tabs.map((tab) => {
          const active = tab.href === pathname
          const named = tab.icon === undefined ? undefined : tabIcons[tab.icon]
          const icon = named ?? activityOfHref(activities, tab.href)?.icon ?? <FileIcon />
          return (
            <li
              key={tab.id}
              className={cn(
                'group/tab relative flex items-center border-r text-xs',
                active
                  ? 'bg-background text-foreground before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
              )}
            >
              <Link
                href={tab.href as Route}
                aria-current={active ? 'page' : undefined}
                title={tab.title}
                onAuxClick={(event) => {
                  if (event.button !== 1) return
                  event.preventDefault()
                  close(tab)
                }}
                className="flex h-full max-w-56 items-center gap-1.5 pr-1 pl-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <span
                  aria-hidden
                  className={cn('flex shrink-0 [&_svg]:size-3.5', active && 'text-primary')}
                >
                  {icon}
                </span>
                <span className="truncate">{tab.title}</span>
              </Link>
              <button
                type="button"
                aria-label={`Close ${tab.title}`}
                onClick={() => {
                  close(tab)
                }}
                className={cn(
                  'mr-1 flex size-5 items-center justify-center rounded-sm outline-none group-hover/tab:opacity-100 hover:bg-muted focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50',
                  !active && 'opacity-0',
                )}
              >
                <XIcon aria-hidden className="size-3" />
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
