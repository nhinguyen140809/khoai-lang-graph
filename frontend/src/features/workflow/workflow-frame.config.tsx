import { NetworkIcon, PlayIcon } from 'lucide-react'

import type { FeatureActivity, TabIcons } from '@/shared/components/frame'
import { SidePanel } from '@/shared/components/frame'
import { routes } from '@/shared/config/routes'

import { RunTree } from './components/RunTree'

/** The workflow on the activity bar, with the runs and their steps as the side panel. */
export function workflowActivity(projectId: string): FeatureActivity {
  return {
    id: 'workflow',
    label: 'Workflow',
    icon: <NetworkIcon />,
    href: routes.project(projectId).workflow(),
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
