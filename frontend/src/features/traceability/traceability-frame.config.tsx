import { GitForkIcon, TableIcon } from 'lucide-react'
import type { Route } from 'next'

import type { FeatureActivity, TabIcons } from '@/components/layout/activity.types'
import { SidePanel } from '@/components/layout/SidePanel'

import { TraceabilityNav } from './components/TraceabilityNav'

/** The traceability on the activity bar, with its views as the side panel. */
export function traceabilityActivity(projectId: string): FeatureActivity {
  return {
    id: 'traceability',
    label: 'Traceability',
    icon: <GitForkIcon />,
    href: `/projects/${encodeURIComponent(projectId)}/traceability` as Route,
    panel: (
      <SidePanel title="Traceability">
        <TraceabilityNav projectId={projectId} />
      </SidePanel>
    ),
  }
}

/** The tab of a view, the matrix or the issues. */
export const traceabilityTabIcons: TabIcons = { view: <TableIcon /> }
