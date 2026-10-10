'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import {
  activityFooterItems,
  type ActivityItemConfig,
  activityItems,
  featureHref,
  featureOfPathname,
  featureTabGroup,
  type ProjectFeature,
} from './activity-bar.config'
import { useEditorTabsStore } from './editor-tabs.store'
import { useFrameStore } from './frame.store'

interface ActivityBarProps {
  /** The project whose features are listed; absent outside a project. */
  projectId?: string
  /** The account menu, at the bottom. */
  user: ReactNode
  /** A count shown on an item, such as the reviews waiting on Chat. */
  badges?: Partial<Record<ProjectFeature, ReactNode>>
}

const itemClassName =
  'relative flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-5'

/**
 * One icon per feature of the project; the icons are disabled until a project is open. An item opens the page last shown in its feature; the
 * item of the feature on screen shows or hides the side panel instead.
 */
export function ActivityBar({ projectId, user, badges = {} }: ActivityBarProps) {
  return (
    <nav
      aria-label="Features"
      className="flex w-12 shrink-0 flex-col items-center gap-1 bg-sidebar py-1.5"
    >
      {activityItems.map((item) => (
        <ActivityItem key={item.label} item={item} projectId={projectId} badges={badges} />
      ))}
      <div className="mt-auto flex flex-col items-center gap-1">
        {activityFooterItems.map((item) => (
          <ActivityItem key={item.label} item={item} projectId={projectId} badges={badges} />
        ))}
        {user}
      </div>
    </nav>
  )
}

interface ActivityItemProps {
  item: ActivityItemConfig
  projectId: string | undefined
  badges: Partial<Record<ProjectFeature, ReactNode>>
}

function ActivityItem({ item, projectId, badges }: ActivityItemProps) {
  const pathname = usePathname()
  const lastHrefs = useEditorTabsStore((state) => state.lastHrefs)
  const toggleSidePanel = useFrameStore((state) => state.toggleSidePanel)
  const setSidePanelVisible = useFrameStore((state) => state.setSidePanelVisible)
  const { label, icon: Icon, feature, note } = item

  if (feature === undefined || projectId === undefined) {
    const reason = feature === undefined ? note : 'select a project first'
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-disabled="true"
            className={cn(itemClassName, 'cursor-default opacity-50 hover:text-muted-foreground')}
          >
            <Icon aria-hidden />
            <span className="sr-only">
              {label}, {reason}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {label} ({reason})
        </TooltipContent>
      </Tooltip>
    )
  }

  const active = featureOfPathname(pathname) === feature
  const href = (lastHrefs[featureTabGroup(projectId, feature)] ??
    featureHref(projectId, feature)) as Route

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          aria-current={active ? 'page' : undefined}
          onClick={(event) => {
            if (active) {
              // Like an editor: the item of the open feature toggles its side panel.
              event.preventDefault()
              toggleSidePanel()
            } else {
              setSidePanelVisible(true)
            }
          }}
          className={cn(
            itemClassName,
            active &&
              'text-foreground before:absolute before:inset-y-1.5 before:-left-1.5 before:w-0.5 before:rounded-full before:bg-primary',
          )}
        >
          <Icon aria-hidden />
          <span className="sr-only">{label}</span>
          {badges[feature] !== undefined && (
            <span className="absolute -top-0.5 -right-0.5">{badges[feature]}</span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
