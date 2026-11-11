import { DocumentPage } from '@/modules/documents/widgets/document'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a tab that is visited
// again shows its state as it was left. The params are read before anything shows, so the route
// is allowed to block, as it did before.
export const instant = false

/** One document of the project, in a tab. */
export default async function Page({
  params,
}: PageProps<'/projects/[projectId]/documents/[artifactId]'>) {
  const { projectId, artifactId } = await params
  return <DocumentPage projectId={projectId} artifactId={artifactId} />
}
