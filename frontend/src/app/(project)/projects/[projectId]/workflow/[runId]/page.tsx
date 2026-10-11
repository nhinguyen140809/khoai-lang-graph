import { RunView } from '@/features/workflow'

export default async function Page({
  params,
}: PageProps<'/projects/[projectId]/workflow/[runId]'>) {
  const { projectId, runId } = await params
  return <RunView projectId={projectId} runId={runId} />
}
