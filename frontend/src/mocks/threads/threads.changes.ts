import { deletedThreadIds, threadEdits } from './threads.store'
import type { ThreadEdit } from './threads.types'

/** Changes a thread of the fixtures or one created since; a thread that is not found stays so. */
export function changeThread(threadId: string, change: ThreadEdit) {
  const edits = threadEdits.get()
  threadEdits.set({ ...edits, [threadId]: { ...edits[threadId], ...change } })
}

/** Removes a thread: the mock server leaves it out of its lists, and its endpoints miss it. */
export function removeThread(threadId: string) {
  deletedThreadIds.set([...deletedThreadIds.get(), threadId])
}
