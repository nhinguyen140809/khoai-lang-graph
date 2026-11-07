import { z } from 'zod'

import { artifactRefSchema, type ItemRef } from '@/modules/artifact/entities/@x/review'
import {
  checkpointOptionSchema,
  checkpointQuestionSchema,
  type QuestionAnswer,
  questionAnswerSchema,
} from '@/modules/workflow/entities/@x/review'

// Temporary hand-written schemas for the interrupts of the runs.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** Where an interrupt stands: waiting for the user, answered, or dropped with its run. */
export const interruptStatuses = ['pending', 'resolved', 'cancelled'] as const

export type InterruptStatus = (typeof interruptStatuses)[number]

/** Who asks a question: the checkpoint of the definition, or an agent at run time. */
export const questionSources = ['definition', 'agent'] as const

export type QuestionSource = (typeof questionSources)[number]

/** A question of an interrupt: a question of a checkpoint, with who asks it. */
export const interruptQuestionSchema = checkpointQuestionSchema.extend({
  source: z.enum(questionSources),
})

export type InterruptQuestion = z.infer<typeof interruptQuestionSchema>

/** The decision that resolved an interrupt: what the user answered, or the run took. */
export const interruptDecisionSchema = z.object({
  option: z.string().nullable(),
  feedback: z.string().nullable(),
  answers: z.record(z.string(), questionAnswerSchema),
  /** Null when the run took the defaults without asking. */
  decided_by: z.string().nullable(),
  decided_at: z.iso.datetime(),
})

export type InterruptDecision = z.infer<typeof interruptDecisionSchema>

/** A pause of a run that waits for the user, with what it asks and what it reviews. */
export const interruptSchema = z.object({
  id: z.string(),
  run_id: z.string(),
  /** The step of the checkpoint node that created it. */
  step_id: z.string(),
  node: z.string(),
  prompt: z.string(),
  /** Empty when the interrupt only asks questions. */
  options: z.array(checkpointOptionSchema),
  questions: z.array(interruptQuestionSchema),
  allow_edits: z.boolean(),
  review_artifacts: z.array(artifactRefSchema),
  status: z.enum(interruptStatuses),
  created_at: z.iso.datetime(),
  resolved_at: z.iso.datetime().nullable(),
  /** The decision that resolved it; null while it waits and when the run stopped. */
  decision: interruptDecisionSchema.nullable(),
})

export type Interrupt = z.infer<typeof interruptSchema>

/** An item that the user edited before answering, at its new version. */
export type ModifiedItem = Pick<ItemRef, 'item_id' | 'version'>

/** The body of the request that answers the pending interrupt of a run. */
export interface ResumeRunBody {
  interrupt_id: string
  /** Null only when the interrupt has no options. */
  option: string | null
  feedback: string | null
  /** One entry for each answered question, by question key. */
  answers: Record<string, QuestionAnswer>
  modified_items: ModifiedItem[]
}

/** What a list of interrupts is narrowed to; a field left out narrows nothing. */
export interface InterruptFilters {
  status?: InterruptStatus | undefined
}
