import { ChatPage } from '@/features/chat'

export default async function Page({ params }: PageProps<'/threads/[threadId]'>) {
  const { threadId } = await params
  return <ChatPage threadId={threadId} />
}
