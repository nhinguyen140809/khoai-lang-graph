import type { Thread } from '@/modules/thread/entities'

import { mockState } from '../shared/db'
import type { ThreadEdit } from './threads.types'

// Threads created with POST /projects/{project_id}/threads, what PATCH /threads/{thread_id}
// changed in them, and the ids of the ones that DELETE /threads/{thread_id} removed.

// Threads created with POST /projects/{project_id}/threads.
export const createdThreads = mockState<Thread[]>('created-threads', () => [])

// What a thread was renamed to, and whether it was archived; the edit of a deleted thread stays.
export const threadEdits = mockState<Record<string, ThreadEdit>>('thread-edits', () => ({}))

// The ids of the threads that DELETE /threads/{thread_id} removed.
export const deletedThreadIds = mockState<string[]>('deleted-threads', () => [])
