import { createFileRoute } from '@tanstack/react-router'

import { ChatPage } from '@/features/chat'

// TODO: replace with a real thread id once the threads API exists.
const DRAFT_THREAD_ID = 'draft'

export const Route = createFileRoute('/')({
  component: () => <ChatPage threadId={DRAFT_THREAD_ID} />,
})
