'use client'

import type { ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import {
  activityFooterItems,
  type ActivityItemConfig,
  activityItems,
  type ProjectFeature,
} from './activity-bar.config'
import { useFrameStore } from './frame.store'
import { useSideFeature } from './hooks/useSideFeature'

interface ActivityBarProps {
  /** The project whose features are listed; absent outside a project. */
  projectId?: string
  /** The account menu, at the bottom. */
  user: ReactNode
  /** A count shown on an item, such as the reviews waiting on Console. */
  badges?: Partial<Record<ProjectFeature, ReactNode>>
}

const itemClassName =
  'relative flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-5'

/**
 * One icon per feature of the project; the icons are disabled until a project is open. An item
 * shows the side panel of its feature and leaves the editor as it is; the item of the side panel
 * on screen hides the panel instead.
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
  const sideFeature = useSideFeature()
  const toggleSidePanel = useFrameStore((state) => state.toggleSidePanel)
  const showSideFeature = useFrameStore((state) => state.showSideFeature)
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

  const active = sideFeature === feature

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-pressed={active}
          onClick={() => {
            // Like an editor: the item of the open panel toggles it.
            if (active) toggleSidePanel()
            else showSideFeature(feature)
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
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
