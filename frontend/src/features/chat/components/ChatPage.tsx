'use client'

import { ErrorState, LoadingState } from '@/components/state'

import { useChatThread } from '../hooks/useChatThread'
import { ChatConversation } from './ChatConversation'

interface ChatPageProps {
  projectId: string
}

/**
 * The conversation of a project: one flow of messages, input at the bottom. The page resolves the
 * thread that holds it, then renders the conversation; the thread itself is never shown.
 */
export function ChatPage({ projectId }: ChatPageProps) {
  const thread = useChatThread(projectId)

  if (thread.isPending) {
    return <LoadingState label="Loading the conversation" />
  }

  if (thread.isError) {
    return <ErrorState message={thread.error.message} onRetry={() => void thread.refetch()} />
  }

  return <ChatConversation threadId={thread.data} />
}
