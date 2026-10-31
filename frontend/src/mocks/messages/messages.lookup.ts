import type { Message } from '@/modules/thread/entities'

import { generatedMessages } from '../generated/fixtures/generated-projects.fixtures'
import { messageFixtures } from './messages.fixtures'
import { createdMessages } from './messages.store'

// The messages as the mock server holds them now: the fixtures, the first messages of the
// generated projects, and the messages sent since.

/** Every message the mock server holds, whatever thread it belongs to. */
export function allMessages(): Message[] {
  return [...messageFixtures, ...generatedMessages(), ...createdMessages.get()]
}

/** The messages of a thread in the order they were sent, the sent ones last. */
export function messagesOfThread(threadId: string): Message[] {
  return allMessages()
    .filter((message) => message.thread_id === threadId)
    .toSorted((a, b) => a.sequence - b.sequence)
}
