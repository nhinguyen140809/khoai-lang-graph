import type { CardEntry } from '../../../design-system.types'
import { ArtifactTree } from '../../ArtifactTree'
import { SampleCard } from '../../Sample'

export function ExplorerTreeCard() {
  return (
    <SampleCard
      title="Artifact explorer"
      description="Headless Tree: arrow keys move, Enter selects."
    >
      <ArtifactTree />
    </SampleCard>
  )
}

export const explorerTreeCardEntry = {
  id: 'explorer-tree',
  label: 'Artifact explorer',
  section: 'navigation',
  span: 3,
  keywords: 'tree folder file explorer',
  View: ExplorerTreeCard,
} satisfies CardEntry
