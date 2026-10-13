import { GitForkIcon, TableIcon } from 'lucide-react'

import type { FeatureActivity, TabIcons } from '@/components/layout'
import { SidePanel } from '@/components/layout'
import { traceabilityHref } from '@/lib/routes.utils'

import { TraceabilityNav } from './components/TraceabilityNav'

/** The traceability on the activity bar, with its views as the side panel. */
export function traceabilityActivity(projectId: string): FeatureActivity {
  return {
    id: 'traceability',
    label: 'Traceability',
    icon: <GitForkIcon />,
    href: traceabilityHref(projectId),
    panel: (
      <SidePanel title="Traceability">
        <TraceabilityNav projectId={projectId} />
      </SidePanel>
    ),
  }
}

/** The name of the tab icon of a view, which its page gives `useEditorTab`. */
export const TraceabilityTabIcon = { View: 'traceability.view' } as const

/** The tab of a view, the matrix or the issues. */
export const traceabilityTabIcons: TabIcons = { [TraceabilityTabIcon.View]: <TableIcon /> }
