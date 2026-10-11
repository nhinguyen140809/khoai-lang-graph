import { ConsolePage } from '@/features/console'

export default async function Page({
  params,
}: PageProps<'/projects/[projectId]/console/[threadId]'>) {
  const { projectId, threadId } = await params
  return <ConsolePage projectId={projectId} threadId={threadId} />
}
