import { ChatPage } from '@/features/chat'
import { ThreadEditorTab } from '@/features/threads'

export default async function Page({ params }: PageProps<'/projects/[projectId]/chat/[threadId]'>) {
  const { projectId, threadId } = await params
  return (
    <>
      <ThreadEditorTab projectId={projectId} threadId={threadId} />
      <ChatPage threadId={threadId} />
    </>
  )
}
