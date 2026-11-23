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

/**
 * One thing that an answer asks the client to do once, such as opening a document, named by the
 * key of a command of the catalog (`docs/workflow/commands.catalog.json`). It names the record that
 * the command needs, and `label` is the short phrase the answer uses for it.
 */
export const uiCommandSchema = z.object({
  command: z.string(),
  artifact_id: z.string().nullable(),
  item_id: z.string().nullable(),
  label: z.string().nullable(),
})

export type UiCommand = z.infer<typeof uiCommandSchema>

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
  /** What an answer of the assistant asks the client to run once; none on any other message. */
  commands: z.array(uiCommandSchema).default([]),
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

/**
 * The answer of a sent message: the message, and the run that took it. A message about the work
 * starts a run of the requirements workflow or joins one. A message about the app is answered in a
 * run of the assistance workflow, which is still running when the answer comes back: the words of
 * the answer, and the commands it asks the client to run, are a message of that run once it ends.
 */
export const sentMessageSchema = z.object({
  message: messageSchema,
  run: runSchema,
})

export type SentMessage = z.infer<typeof sentMessageSchema>
