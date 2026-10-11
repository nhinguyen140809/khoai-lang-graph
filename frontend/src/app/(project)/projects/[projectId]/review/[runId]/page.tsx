import { ArtifactPanel } from '@/features/artifacts'
import { ConsolePage } from '@/features/console'
import { ReviewPage } from '@/features/review'

export default async function Page({ params }: PageProps<'/projects/[projectId]/review/[runId]'>) {
  const { projectId, runId } = await params
  return (
    <ReviewPage
      projectId={projectId}
      runId={runId}
      Artifacts={ArtifactPanel}
      Console={ConsolePage}
    />
  )
}
