'use client'

import { useIsProjectWriting } from '@/modules/project/entities'
import type { LiveTraceOptions } from '@/modules/trace/entities'
import { liveTraceMs } from '@/modules/trace/entities'
import { SidePanel, SidePanelSection } from '@/shared/components/frame'

import { tracePanelMessages } from '../trace-panel.constants'
import { OverviewSection } from './OverviewSection'
import { TraceTreeSection } from './TraceTree'

/**
 * The side panel of Trace, in two sections: an overview of what needs attention, one row per gap
 * of the coverage and one for the open issues, and the documents of the project with their items,
 * where choosing an item opens its chain. While the agents write, both reload every few seconds.
 */
export function TracePanel({ projectId }: { projectId: string }) {
  const isWriting = useIsProjectWriting(projectId)
  const live: LiveTraceOptions = { refetchInterval: isWriting ? liveTraceMs : false }

  return (
    <SidePanel title={tracePanelMessages.title}>
      <div className="flex flex-col gap-4 pb-4">
        <SidePanelSection title={tracePanelMessages.overview}>
          <OverviewSection live={live} />
        </SidePanelSection>
        <SidePanelSection title={tracePanelMessages.documents}>
          <TraceTreeSection live={live} />
        </SidePanelSection>
      </div>
    </SidePanel>
  )
}
