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
      className="flex w-22 shrink-0 flex-col items-center gap-1 bg-sidebar px-1.5 py-2"
    >
      {destinations
        .filter((destination) => destination.placement !== 'bottom')
        .map((destination) => (
          <DestinationItem key={destination.id} destination={destination} />
        ))}
      <div className="mt-auto flex flex-col items-center gap-1">
        {destinations
          .filter((destination) => destination.placement === 'bottom')
          .map((destination) => (
            <DestinationItem key={destination.id} destination={destination} />
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

function DestinationItem({ destination }: { destination: Destination }) {
  const { feature, isPanelShown, toggle } = useSideFeature()

  if (!isFeatureDestination(destination)) {
    // The name is on the item; the reason it is not there yet shows beside it.
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <ActivityBarButton aria-disabled="true" icon={destination.icon} label={destination.label}>
            <span className="sr-only">, {destination.note}</span>
          </ActivityBarButton>
        </TooltipTrigger>
        <TooltipContent side="right">{destination.note}</TooltipContent>
      </Tooltip>
    )
  }

  // The item is pressed while its panel is shown, not while the panel is hidden.
  const isActive = isPanelShown && feature?.id === destination.id

  return (
    <ActivityBarButton
      aria-pressed={isActive}
      icon={destination.icon}
      label={destination.label}
      onClick={() => {
        toggle(destination.id)
      }}
    >
      {destination.badge !== undefined && (
        <span className="absolute top-0.5 right-2">{destination.badge}</span>
      )}
    </ActivityBarButton>
  )
}

interface ActivityBarButtonProps extends ComponentProps<'button'> {
  icon: ReactNode
  /** The name of the feature, under the icon; cut with an ellipsis when it is wider than the bar. */
  label: string
}

/**
 * An item of the activity bar: the icon with the name under it, then what the item adds, such as a
 * badge. Its look follows its state: `aria-pressed` fills the whole item of the feature whose side
 * panel is shown and sets its name in semibold, the pointer over another item changes its icon and name to the text color, and
 * `aria-disabled` dims a feature planned for later.
 */
function ActivityBarButton({ icon, label, children, ...props }: ActivityBarButtonProps) {
  return (
    <button
      type="button"
      className="relative flex w-full flex-col items-center gap-1 rounded-md py-1.5 text-muted-foreground transition-colors outline-none not-aria-disabled:hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-pressed:bg-sidebar-accent aria-pressed:font-semibold aria-pressed:text-foreground motion-reduce:transition-none"
      {...props}
    >
      <span aria-hidden className="flex h-7 w-10 items-center justify-center [&_svg]:size-5">
        {icon}
      </span>
      <span className="max-w-full truncate px-0.5 text-xs">{label}</span>
      {children}
    </button>
  )
}
