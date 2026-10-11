import { z } from 'zod'

// Temporary hand-written schemas for the interrupts and the resume request.
// TODO: replace with the types generated into src/api/generated/ once they exist.

export const optionSchema = z.object({
  key: z.string(),
  label: z.string(),
  requires_feedback: z.boolean(),
  approves: z.boolean(),
  is_default: z.boolean(),
})

export type ReviewOption = z.infer<typeof optionSchema>

export const answerSchema = z.object({
  choice_keys: z.array(z.string()),
  text: z.string().nullable(),
  number: z.number().nullable(),
})

export type Answer = z.infer<typeof answerSchema>

export const questionTypes = ['single_select', 'multi_select', 'free_text', 'number'] as const

export const questionSchema = z.object({
  key: z.string(),
  type: z.enum(questionTypes),
  prompt: z.string(),
  required: z.boolean(),
  choices: z.array(z.object({ key: z.string(), label: z.string(), requires_text: z.boolean() })),
  min_selected: z.number().int().nullable(),
  max_selected: z.number().int().nullable(),
  default_answer: answerSchema,
  source: z.string(),
})

export type Question = z.infer<typeof questionSchema>

/** A pause of a run that waits for the user: a checkpoint, with what it asks. */
export const interruptSchema = z.object({
  id: z.string(),
  run_id: z.string(),
  step_id: z.string().nullable(),
  node: z.string(),
  prompt: z.string(),
  options: z.array(optionSchema),
  questions: z.array(questionSchema),
  allow_edits: z.boolean(),
  review_artifacts: z.array(
    z.object({
      artifact_id: z.string(),
      kind: z.string(),
      title: z.string(),
      version: z.number().int(),
    }),
  ),
  status: z.enum(['pending', 'resolved']),
  created_at: z.iso.datetime(),
  resolved_at: z.iso.datetime().nullable(),
})

export type Interrupt = z.infer<typeof interruptSchema>

/** The body of the request that answers an interrupt. */
export interface ResumeBody {
  interrupt_id: string
  option: string | null
  feedback: string | null
  answers: Record<string, Answer>
  modified_items: { item_id: string; version: number }[]
}

/** The fields of an item that the review needs to tell which ones the user changed. */
export const reviewedItemSchema = z.object({
  id: z.string(),
  key: z.string(),
  version: z.number().int(),
  updated_by: z.object({ actor: z.enum(['agent', 'user']) }),
})

export type ReviewedItem = z.infer<typeof reviewedItemSchema>

/** The run that a resume continues. */
export const resumedRunSchema = z.object({ id: z.string(), status: z.string() })
