import { NetworkIcon, PlayIcon } from 'lucide-react'

import type { FeatureActivity, TabIcons } from '@/components/layout'
import { SidePanel } from '@/components/layout'
import { workflowHref } from '@/lib/routes.utils'

import { RunTree } from './components/RunTree'

/** The workflow on the activity bar, with the runs and their steps as the side panel. */
export function workflowActivity(projectId: string): FeatureActivity {
  return {
    id: 'workflow',
    label: 'Workflow',
    icon: <NetworkIcon />,
    href: workflowHref(projectId),
    panel: (
      <SidePanel title="Runs">
        <RunTree projectId={projectId} />
      </SidePanel>
    ),
  }
}

/** The name of the tab icon of a run, which its page gives `useEditorTab`. */
export const WorkflowTabIcon = { Run: 'workflow.run' } as const

export const workflowTabIcons: TabIcons = { [WorkflowTabIcon.Run]: <PlayIcon /> }
