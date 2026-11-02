import { DocumentPage } from '@/modules/documents/widgets/document'

/** One document of the project, in a tab. */
export default async function Page({
  params,
}: PageProps<'/projects/[projectId]/documents/[artifactId]'>) {
  const { projectId, artifactId } = await params
  return <DocumentPage projectId={projectId} artifactId={artifactId} />
}
