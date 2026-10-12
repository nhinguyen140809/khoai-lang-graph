import { FileIcon, FileStackIcon, FileTextIcon } from 'lucide-react'
import type { Route } from 'next'

import type { FeatureActivity, TabIcons } from '@/components/layout/activity.types'
import { SidePanel } from '@/components/layout/SidePanel'

import { ArtifactTree } from './components/ArtifactTree'
import { ExportButton } from './components/ExportButton'

/** The artifacts on the activity bar, with the tree of the artifacts as the side panel. */
export function artifactsActivity(projectId: string): FeatureActivity {
  return {
    id: 'artifacts',
    label: 'Artifacts',
    icon: <FileStackIcon />,
    href: `/projects/${encodeURIComponent(projectId)}/artifacts` as Route,
    panel: (
      <SidePanel title="Artifacts" actions={<ExportButton projectId={projectId} openFromAddress />}>
        <ArtifactTree projectId={projectId} />
      </SidePanel>
    ),
  }
}

/** The tab of an artifact shown as a document, and the tab of one item. */
export const artifactTabIcons: TabIcons = { artifact: <FileTextIcon />, item: <FileIcon /> }
