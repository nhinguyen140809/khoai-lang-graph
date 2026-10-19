'use client'

import type { ComponentProps, ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

import type { Destination } from '../destination.types'
import { isFeatureDestination } from '../destination.utils'
import { useDestinations } from '../hooks/useDestinations'
import { useRegisteredActivityBarItems } from '../hooks/useRegisteredActivityBarItems'
import { useSideFeature } from '../hooks/useSideFeature'

/**
 * One item per feature that the screen gives Workbench, then the items registered with
 * `useActivityBarItem`, such as the account menu; a screen that gives no feature, such as the
 * screens outside a project today, shows those items only. The item of a feature shows its icon
 * with the name under it. It shows the side panel of its feature and leaves the editor as it is;
 * the item of the side panel on screen hides the panel instead.
 */
export function ActivityBar() {
  const { destinations } = useDestinations()
  const items = useRegisteredActivityBarItems()

  return (
    <nav
      aria-label="Features"
      className="flex w-16 shrink-0 flex-col items-center gap-1 bg-sidebar py-2"
    >
      {destinations
        .filter((destination) => destination.placement !== 'bottom')
        .map((destination) => (
          <ActivityItem key={destination.id} destination={destination} />
        ))}
      <div className="mt-auto flex flex-col items-center gap-1">
        {destinations
          .filter((destination) => destination.placement === 'bottom')
          .map((destination) => (
            <ActivityItem key={destination.id} destination={destination} />
          ))}
        {/* An item that fails to render leaves the bar, not the screen, and comes back when it
            registers a new content. */}
        {items.map(({ key, content }) => (
          <ErrorBoundary key={key} fallback={null} resetKeys={[content]}>
            {content}
          </ErrorBoundary>
        ))}
      </div>
    </nav>
  )
}

function ActivityItem({ destination }: { destination: Destination }) {
  const { feature, toggle } = useSideFeature()

  if (!isFeatureDestination(destination)) {
    // The name is on the item; the reason it is not there yet shows beside it.
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <ActivityButton aria-disabled="true" icon={destination.icon} label={destination.label}>
            <span className="sr-only">, {destination.note}</span>
          </ActivityButton>
        </TooltipTrigger>
        <TooltipContent side="right">{destination.note}</TooltipContent>
      </Tooltip>
    )
  }

  const active = feature?.id === destination.id

  return (
    <ActivityButton
      aria-pressed={active}
      icon={destination.icon}
      label={destination.label}
      onClick={() => {
        toggle(destination.id)
      }}
    >
      {destination.badge !== undefined && (
        <span className="absolute top-0.5 right-2">{destination.badge}</span>
      )}
    </ActivityButton>
  )
}

interface ActivityButtonProps extends ComponentProps<'button'> {
  icon: ReactNode
  /** The name of the feature, under the icon; cut with an ellipsis when it is wider than the bar. */
  label: string
}

/**
 * An item of the activity bar: the icon in a rounded shape, the name under it, then what the item
 * adds, such as a badge. Its look follows its state: `aria-pressed` fills the shape of the feature
 * whose side panel is shown and sets its name in medium weight, the pointer over another item
 * fills its shape lighter, and `aria-disabled` dims a feature planned for later.
 */
function ActivityButton({ icon, label, children, ...props }: ActivityButtonProps) {
  return (
    <button
      type="button"
      className="group/item relative flex w-14 flex-col items-center gap-1 rounded-md py-1 text-muted-foreground outline-none not-aria-disabled:hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-pressed:font-bold aria-pressed:text-foreground"
      {...props}
    >
      <span
        aria-hidden
        className="flex h-7 w-10 items-center justify-center rounded-md transition-colors group-hover/item:group-not-aria-pressed/item:group-not-aria-disabled/item:bg-sidebar-accent/60 group-aria-pressed/item:bg-sidebar-accent motion-reduce:transition-none [&_svg]:size-5"
      >
        {icon}
      </span>
      <span className="max-w-full truncate px-0.5 text-xs">{label}</span>
      {children}
    </button>
  )
}
