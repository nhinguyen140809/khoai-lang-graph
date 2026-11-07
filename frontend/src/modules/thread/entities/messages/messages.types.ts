import { z } from 'zod'

import { artifactRefSchema, itemRefSchema } from '@/modules/artifact/entities/@x/thread'
import { type RunDefaults, runSchema } from '@/modules/run/entities/@x/thread'

// Temporary hand-written schemas for the messages of the threads.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** Who wrote a message of the chat. */
export const messageAuthors = ['user', 'agent', 'system'] as const

export type MessageAuthor = (typeof messageAuthors)[number]

/** What became of a message of the user: it started a run, waits for one, or was taken in or not. */
export const messageDeliveries = ['started_run', 'pending', 'delivered', 'undelivered'] as const

export type MessageDelivery = (typeof messageDeliveries)[number]

/** Which note a message of the user reads while it waits: in the step that runs, after the review, or never. */
export type MessageDeliveryNote = 'pendingInStep' | 'pendingInReview' | 'undelivered'

/** A message of the chat between the user and the system, on the thread it belongs to. */
export const messageSchema = z.object({
  id: z.string(),
  thread_id: z.string(),
  /** Order of the message in its thread, from 1, without gaps. */
  sequence: z.number().int(),
  /** The run that the message started or belongs to. */
  run_id: z.string().nullable(),
  author: z.enum(messageAuthors),
  /** Set when `author` is `agent`. */
  agent_role: z.string().nullable(),
  /** Markdown. */
  content: z.string(),
  /** Artifacts mentioned or produced. */
  artifact_refs: z.array(artifactRefSchema),
  /** Items mentioned. */
  item_refs: z.array(itemRefSchema),
  /** On the messages of the user only. */
  delivery: z.enum(messageDeliveries).nullable(),
  /** The step that took the message in, once it is delivered. */
  delivered_in_step_id: z.string().nullable(),
  created_at: z.iso.datetime(),
})

export type Message = z.infer<typeof messageSchema>

/** The body of the request that sends a message of the user to a thread. */
export interface SendMessageBody {
  content: string
  /** Settings of the run that the message starts; not read when the thread has an unfinished run. */
  run_config?: RunDefaults
  /** By agent role, the model of the run that the message starts (`provider:model`). */
  models?: Record<string, string>
}

/** The answer of a sent message: the message, and the run that it started or was sent to. */
export const sentMessageSchema = z.object({ message: messageSchema, run: runSchema })

export type SentMessage = z.infer<typeof sentMessageSchema>
