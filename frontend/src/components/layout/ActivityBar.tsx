'use client'

import type { ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { useActivities } from './ActivitiesContext'
import type { Activity } from './activity.types'
import { isFeatureActivity } from './activity.utils'
import { useFrameStore } from './frame.store'
import { useSideFeature } from './hooks/useSideFeature'

interface ActivityBarProps {
  /** The account menu, at the bottom. */
  user: ReactNode
}

const itemClassName =
  'relative flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-5'

/**
 * One icon per feature that the screen gives AppFrame, then the account menu; a screen that gives
 * none, such as the screens outside a project today, shows the account menu only. An item shows
 * the side panel of its feature and leaves the editor as it is; the item of the side panel on
 * screen hides the panel instead.
 */
export function ActivityBar({ user }: ActivityBarProps) {
  const { activities } = useActivities()

  return (
    <nav
      aria-label="Features"
      className="flex w-12 shrink-0 flex-col items-center gap-1 bg-sidebar py-1.5"
    >
      {activities
        .filter((activity) => activity.placement !== 'bottom')
        .map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      <div className="mt-auto flex flex-col items-center gap-1">
        {activities
          .filter((activity) => activity.placement === 'bottom')
          .map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        {user}
      </div>
    </nav>
  )
}

function ActivityItem({ activity }: { activity: Activity }) {
  const sideFeature = useSideFeature()
  const toggleSidePanel = useFrameStore((state) => state.toggleSidePanel)
  const showSideFeature = useFrameStore((state) => state.showSideFeature)
  const icon = (
    <span aria-hidden className="flex">
      {activity.icon}
    </span>
  )

  if (!isFeatureActivity(activity)) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-disabled="true"
            className={cn(itemClassName, 'cursor-default opacity-50 hover:text-muted-foreground')}
          >
            {icon}
            <span className="sr-only">
              {activity.label}, {activity.note}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {activity.label} ({activity.note})
        </TooltipContent>
      </Tooltip>
    )
  }

  const active = sideFeature?.id === activity.id

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-pressed={active}
          onClick={() => {
            // Like an editor: the item of the open panel toggles it.
            if (active) toggleSidePanel()
            else showSideFeature(activity.id)
          }}
          className={cn(
            itemClassName,
            active &&
              'text-foreground before:absolute before:inset-y-1.5 before:-left-1.5 before:w-0.5 before:rounded-full before:bg-primary',
          )}
        >
          {icon}
          <span className="sr-only">{activity.label}</span>
          {activity.badge !== undefined && (
            <span className="absolute -top-0.5 -right-0.5">{activity.badge}</span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{activity.label}</TooltipContent>
    </Tooltip>
  )
}
