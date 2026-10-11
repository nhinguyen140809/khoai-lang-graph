import { SessionPage } from '@/features/session'

export default async function Page({
  params,
}: PageProps<'/projects/[projectId]/session/[threadId]'>) {
  const { projectId, threadId } = await params
  return <SessionPage projectId={projectId} threadId={threadId} />
}
