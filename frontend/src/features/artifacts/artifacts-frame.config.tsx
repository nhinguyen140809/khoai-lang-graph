import { FileIcon, FileStackIcon, FileTextIcon } from 'lucide-react'

import type { FeatureActivity, TabIcons } from '@/frame'
import { SidePanel } from '@/frame'
import { artifactsHref } from '@/shared/config/routes.utils'

import { ArtifactTree } from './components/ArtifactTree'
import { ExportButton } from './components/ExportButton'

/** The artifacts on the activity bar, with the tree of the artifacts as the side panel. */
export function artifactsActivity(projectId: string): FeatureActivity {
  return {
    id: 'artifacts',
    label: 'Artifacts',
    icon: <FileStackIcon />,
    href: artifactsHref(projectId),
    panel: (
      <SidePanel title="Artifacts" actions={<ExportButton projectId={projectId} openFromAddress />}>
        <ArtifactTree projectId={projectId} />
      </SidePanel>
    ),
  }
}

/** The names of the tab icons of the artifacts, which their pages give `useEditorTab`. */
export const ArtifactTabIcon = { Artifact: 'artifacts.artifact', Item: 'artifacts.item' } as const

/** The tab of an artifact shown as a document, and the tab of one item. */
export const artifactTabIcons: TabIcons = {
  [ArtifactTabIcon.Artifact]: <FileTextIcon />,
  [ArtifactTabIcon.Item]: <FileIcon />,
}
