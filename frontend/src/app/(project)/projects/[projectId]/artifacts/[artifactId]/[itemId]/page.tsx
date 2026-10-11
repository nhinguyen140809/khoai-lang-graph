import { ArtifactItemPage } from '@/features/artifacts'

export default async function Page({
  params,
}: PageProps<'/projects/[projectId]/artifacts/[artifactId]/[itemId]'>) {
  const { projectId, artifactId, itemId } = await params
  return <ArtifactItemPage projectId={projectId} artifactId={artifactId} itemId={itemId} />
}
