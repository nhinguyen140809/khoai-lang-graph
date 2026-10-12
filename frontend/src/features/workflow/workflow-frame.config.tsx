import { NetworkIcon, PlayIcon } from 'lucide-react'
import type { Route } from 'next'

import type { FeatureActivity, TabIcons } from '@/components/layout/activity.types'
import { SidePanel } from '@/components/layout/SidePanel'

import { RunTree } from './components/RunTree'

/** The workflow on the activity bar, with the runs and their steps as the side panel. */
export function workflowActivity(projectId: string): FeatureActivity {
  return {
    id: 'workflow',
    label: 'Workflow',
    icon: <NetworkIcon />,
    href: `/projects/${encodeURIComponent(projectId)}/workflow` as Route,
    panel: (
      <SidePanel title="Runs">
        <RunTree projectId={projectId} />
      </SidePanel>
    ),
  }
}

export const workflowTabIcons: TabIcons = { run: <PlayIcon /> }
