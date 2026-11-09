import { OpenIssuesPage } from '@/modules/traceability/widgets/issues'

/** The open issues of the project, in a tab. */
export default async function Page({ params }: PageProps<'/projects/[projectId]/trace/issues'>) {
  const { projectId } = await params
  return <OpenIssuesPage projectId={projectId} />
}
