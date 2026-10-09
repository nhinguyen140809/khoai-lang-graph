import { ArtifactTree } from '../ArtifactTree'
import { SampleCard } from '../Sample'

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
