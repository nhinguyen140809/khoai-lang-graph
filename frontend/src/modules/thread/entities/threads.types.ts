import { z } from 'zod'

import { unfinishedRunStatuses } from '@/modules/run/entities/@x/thread'

// Temporary hand-written schemas for the threads API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

export const threadSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  created_by: z.string(),
  /** Null until it is given, or generated from the first message. */
  title: z.string().nullable(),
  status: z.enum(['active', 'archived']),
  /** Stage of the latest run; null before the first run. */
  current_stage: z.string().nullable(),
  /** The unfinished run of the thread (queued, running or interrupted), if any. */
  active_run_id: z.string().nullable(),
  /** The status of `active_run_id`; null when the thread has no unfinished run. */
  active_run_status: z.enum(unfinishedRunStatuses).nullable(),
  last_message_at: z.iso.datetime(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export type Thread = z.infer<typeof threadSchema>

// The answers of the requests that send the first message of a project, read for the ids only.

export const createdThreadSchema = z.object({ id: z.string() })

export const sentMessageSchema = z.object({
  message: z.object({ id: z.string() }),
  run: z.object({ id: z.string() }),
})
