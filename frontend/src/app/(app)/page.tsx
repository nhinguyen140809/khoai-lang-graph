import { ChatPage } from '@/features/chat'

// TODO: replace with a real thread id once the threads API exists.
const DRAFT_THREAD_ID = 'draft'

export default function Page() {
  return <ChatPage threadId={DRAFT_THREAD_ID} />
}
