import { z } from 'zod'

import { runStatuses } from '@/modules/run/entities/@x/thread'

// Temporary hand-written schemas for the threads API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** Where a thread stands: in use, or put away by the user. */
export const threadStatuses = ['active', 'archived'] as const

export type ThreadStatus = (typeof threadStatuses)[number]

/** A conversation of a project with the system; its runs start from its messages. */
export const threadSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  created_by: z.string(),
  /** Null until it is given, or generated from the first message. */
  title: z.string().nullable(),
  status: z.enum(threadStatuses),
  /** The stage of the latest run; null before the first run. */
  current_stage: z.string().nullable(),
  /** The unfinished run of the thread (queued, running or interrupted), if any. */
  active_run_id: z.string().nullable(),
  /**
   * The status of the latest run, unfinished or ended; null before the first run. While
   * `active_run_id` is set, the status of that run.
   */
  latest_run_status: z.enum(runStatuses).nullable(),
  /** The time of the newest message; the creation time while the thread has none. */
  last_message_at: z.iso.datetime(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export type Thread = z.infer<typeof threadSchema>

/** What a list of the threads of the user is narrowed to; a field left out narrows nothing. */
export interface ThreadFilters {
  projectId?: string | undefined
}

/** The body of the request that creates an empty thread in a project. */
export interface CreateThreadBody {
  title?: string
}

/** The body of the request that renames a thread, archives it or makes it active again. */
export interface UpdateThreadBody {
  title?: string
  status?: ThreadStatus
}
