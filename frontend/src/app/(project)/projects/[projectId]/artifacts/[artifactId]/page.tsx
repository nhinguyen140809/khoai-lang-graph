import { ArtifactPage } from '@/features/artifacts'

export default async function Page({
  params,
}: PageProps<'/projects/[projectId]/artifacts/[artifactId]'>) {
  const { projectId, artifactId } = await params
  return <ArtifactPage projectId={projectId} artifactId={artifactId} />
}
