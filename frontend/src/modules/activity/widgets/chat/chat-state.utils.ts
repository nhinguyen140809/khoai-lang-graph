import type { ChatLoad, ChatState } from './chat-state.types'

/** What the body of the chat shows, by what it has loaded; a missing thread or nothing said is empty, a load in flight or failed shows itself. */
export function chatStateOf({ hasThread, isPending, isError, hasActivity }: ChatLoad): ChatState {
  if (!hasThread) return 'empty'
  if (isPending) return 'pending'
  if (isError) return 'error'
  return hasActivity ? 'ready' : 'empty'
}
