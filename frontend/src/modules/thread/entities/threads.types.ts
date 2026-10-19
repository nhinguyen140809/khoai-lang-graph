import { z } from 'zod'

import { itemRefSchema, runStatuses } from '@/modules/run/entities/@x/thread'

// Temporary hand-written schemas for the threads API: the threads and their messages.
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
  /**
   * The status of the latest run of the thread, unfinished or ended; the unfinished run of a
   * thread is always its latest. Null before the first run.
   */
  latest_run_status: z.enum(runStatuses).nullable(),
  last_message_at: z.iso.datetime(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export type Thread = z.infer<typeof threadSchema>

export const artifactRefSchema = z.object({
  artifact_id: z.string(),
  kind: z.string(),
  title: z.string(),
  version: z.number().int(),
})

export const messageSchema = z.object({
  id: z.string(),
  thread_id: z.string(),
  /** Order of the message in its thread, from 1, without gaps. */
  sequence: z.number().int(),
  /** The run that the message started or belongs to. */
  run_id: z.string().nullable(),
  author: z.enum(['user', 'agent', 'system']),
  /** Set when `author` is `agent`. */
  agent_role: z.string().nullable(),
  /** Markdown. */
  content: z.string(),
  artifact_refs: z.array(artifactRefSchema),
  item_refs: z.array(itemRefSchema),
  /** On the messages of the user only: what became of the message. */
  delivery: z.enum(['started_run', 'pending', 'delivered', 'undelivered']).nullable(),
  /** The step that took the message in, once it is delivered. */
  delivered_in_step_id: z.string().nullable(),
  created_at: z.iso.datetime(),
})

export type Message = z.infer<typeof messageSchema>

// The answers of the requests that send the first message of a project, read for the ids only.

export const createdThreadSchema = z.object({ id: z.string() })

export const sentMessageSchema = z.object({
  message: z.object({ id: z.string() }),
  run: z.object({ id: z.string() }),
})
