'use client'

import type { ComponentProps, ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { useFrameStore } from '../frame.store'
import { useActivities } from './ActivitiesContext'
import type { Activity } from './activity.types'
import { isFeatureActivity } from './activity.utils'
import { useSideFeature } from './hooks/useSideFeature'

interface ActivityBarProps {
  /** The account menu, at the bottom. */
  account: ReactNode
}

/**
 * One icon per feature that the screen gives Workbench, then the account menu; a screen that gives
 * none, such as the screens outside a project today, shows the account menu only. An item shows
 * the side panel of its feature and leaves the editor as it is; the item of the side panel on
 * screen hides the panel instead.
 */
export function ActivityBar({ account }: ActivityBarProps) {
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
        {account}
      </div>
    </nav>
  )
}

function ActivityItem({ activity }: { activity: Activity }) {
  const sideFeature = useSideFeature()
  const togglePanel = useFrameStore((state) => state.togglePanel)
  const showSideFeature = useFrameStore((state) => state.showSideFeature)
  const icon = (
    <span aria-hidden className="flex">
      {activity.icon}
    </span>
  )

  if (!isFeatureActivity(activity)) {
    return (
      <ActivityButton aria-disabled="true" tooltip={`${activity.label} (${activity.note})`}>
        {icon}
        <span className="sr-only">
          {activity.label}, {activity.note}
        </span>
      </ActivityButton>
    )
  }

  const active = sideFeature?.id === activity.id

  return (
    <ActivityButton
      aria-pressed={active}
      tooltip={activity.label}
      onClick={() => {
        // Like an editor: the item of the open panel toggles it.
        if (active) togglePanel('side')
        else showSideFeature(activity.id)
      }}
    >
      {icon}
      <span className="sr-only">{activity.label}</span>
      {activity.badge !== undefined && (
        <span className="absolute -top-0.5 -right-0.5">{activity.badge}</span>
      )}
    </ActivityButton>
  )
}

interface ActivityButtonProps extends ComponentProps<'button'> {
  /** The name of the item, shown on the right while the pointer is over it. */
  tooltip: string
}

/**
 * An icon button of the activity bar. Its look follows its state: `aria-pressed` marks the
 * feature whose side panel is shown, and `aria-disabled` a feature planned for later.
 */
function ActivityButton({ tooltip, ...props }: ActivityButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none not-aria-disabled:hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-pressed:text-foreground aria-pressed:before:absolute aria-pressed:before:inset-y-1.5 aria-pressed:before:-left-1.5 aria-pressed:before:w-0.5 aria-pressed:before:rounded-full aria-pressed:before:bg-primary [&_svg]:size-5"
          {...props}
        />
      </TooltipTrigger>
      <TooltipContent side="right">{tooltip}</TooltipContent>
    </Tooltip>
  )
}
