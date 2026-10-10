import type { Thread } from './threads.types'

/** The name of a thread; a thread is untitled until it is named or gets its first message. */
export function threadTitle(thread: Pick<Thread, 'title'>): string {
  return thread.title ?? 'New thread'
}
