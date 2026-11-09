import { WaypointsIcon } from 'lucide-react'

import { EmptyState } from '@/shared/components/state'

import { traceHomeMessages } from './trace-home.constants'

/**
 * The start page of Trace, shown while no page of it is open: it asks to open one from the side
 * panel, as the start page of Documents does. The overview of what needs attention is in the side
 * panel, and each of its rows opens in a tab.
 */
export function TraceHomePage() {
  return (
    <EmptyState
      icon={WaypointsIcon}
      title={traceHomeMessages.choose.title}
      description={traceHomeMessages.choose.description}
    />
  )
}
