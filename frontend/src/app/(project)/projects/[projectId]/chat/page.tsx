import { ChatPage } from '@/features/chat'

export default async function Page({ params }: PageProps<'/projects/[projectId]/chat'>) {
  const { projectId } = await params
  return <ChatPage projectId={projectId} />
}
