import { z } from 'zod'

import { runStatuses } from '@/shared/config/run-status.constants'

// Temporary hand-written schemas for the run event stream and the console API.
// TODO: replace with types generated into src/shared/api/generated/ once the run events are
// part of the generated types. Payload fields are provisional.
export const runEventSchemas = {
  node_start: z.object({ node: z.string() }),
  node_end: z.object({ node: z.string() }),
  token: z.object({ node: z.string(), text: z.string() }),
  tool_call: z.object({
    node: z.string(),
    tool: z.string(),
    args: z.record(z.string(), z.unknown()),
  }),
  artifact_created: z.object({ artifact_id: z.string(), name: z.string(), version: z.number() }),
  artifact_delta: z.object({ artifact_id: z.string(), delta: z.string() }),
  message_delivered: z.object({}),
  interrupt: z.object({ node: z.string(), payload: z.unknown() }),
  error: z.object({ message: z.string() }),
  done: z.object({}),
}

export type RunEventType = keyof typeof runEventSchemas

export const RUN_EVENT_TYPES = Object.keys(runEventSchemas) as RunEventType[]

export type RunEvent = {
  [K in RunEventType]: { type: K; id: string; data: z.infer<(typeof runEventSchemas)[K]> }
}[RunEventType]

export type RunStatus = 'streaming' | 'interrupted' | 'succeeded' | 'failed'

// The thread of the console of a project; only its id is read, whatever else the list returns.
export const consoleThreadIdSchema = z.object({ id: z.string() })

export const messageSchema = z.object({
  id: z.string(),
  thread_id: z.string(),
  sequence: z.number().int(),
  /** The run that the message started, or that was running when it was sent. */
  run_id: z.string().nullable(),
  author: z.enum(['user', 'agent', 'system']),
  agent_role: z.string().nullable(),
  content: z.string(),
  /** On user messages only. */
  delivery: z.enum(['started_run', 'pending', 'delivered', 'undelivered']).nullable(),
  delivered_in_step_id: z.string().nullable(),
  created_at: z.iso.datetime(),
})

export type Message = z.infer<typeof messageSchema>

/** The fields of a run that the console shows. */
export const consoleRunSchema = z.object({
  id: z.string(),
  thread_id: z.string(),
  number: z.number().int(),
  status: z.enum(runStatuses),
  current_stage: z.string(),
  retry_of_run_id: z.string().nullable(),
  error: z.object({ code: z.string(), message: z.string() }).nullable(),
  started_at: z.iso.datetime().nullable(),
  finished_at: z.iso.datetime().nullable(),
})

export type ConsoleRun = z.infer<typeof consoleRunSchema>

export const sendMessageResponseSchema = z.object({
  message: messageSchema,
  run: consoleRunSchema,
})

/** The fields of a step that the console shows. */
export const consoleStepSchema = z.object({
  id: z.string(),
  run_id: z.string(),
  sequence: z.number().int(),
  node: z.string(),
  agent_role: z.string().nullable(),
  stage: z.string(),
  status: z.enum(['running', 'succeeded', 'failed', 'skipped']),
  subject_item_id: z.string().nullable(),
  usage: z.object({ duration_ms: z.number().int() }),
  produced: z.array(z.object({ item_id: z.string(), key: z.string() })),
  error: z.string().nullable(),
  started_at: z.iso.datetime(),
  finished_at: z.iso.datetime().nullable(),
})

export type ConsoleStep = z.infer<typeof consoleStepSchema>

/** The review that a paused run waits for. */
export const pendingReviewSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  review_artifacts: z.array(
    z.object({ artifact_id: z.string(), title: z.string(), version: z.number().int() }),
  ),
})

export type PendingReview = z.infer<typeof pendingReviewSchema>

/** An item that `@` can mention: its key and what it is called. */
export const mentionItemSchema = z.object({
  id: z.string(),
  key: z.string(),
  content: z.record(z.string(), z.unknown()),
})

export type MentionItem = z.infer<typeof mentionItemSchema>
