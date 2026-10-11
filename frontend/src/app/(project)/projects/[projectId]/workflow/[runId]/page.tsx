import { RunPage } from '@/features/workflow'

export default async function Page({
  params,
}: PageProps<'/projects/[projectId]/workflow/[runId]'>) {
  const { projectId, runId } = await params
  return <RunPage projectId={projectId} runId={runId} />
}
