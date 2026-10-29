import { z } from 'zod'

import { itemRefSchema } from '@/modules/artifact/entities/@x/run'

// Temporary hand-written schema for the directives of a run.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** An item that a directive refers to, with the role that the kind of the directive gives it. */
export const directiveItemSchema = z.object({
  item: itemRefSchema,
  role: z.string(),
})

export type DirectiveItem = z.infer<typeof directiveItemSchema>

/**
 * An instruction that one part of the workflow gives to another, such as to interview a persona
 * again. Exactly one of `issued_by_step_id` and `human_decision_id` is set.
 */
export const directiveSchema = z.object({
  id: z.string(),
  run_id: z.string(),
  /** A kind of the definition: `rework` or `intent` in the first version. */
  kind: z.string(),
  issued_by_step_id: z.string().nullable(),
  human_decision_id: z.string().nullable(),
  /** The node that acts on it. */
  target_node: z.string(),
  /** The loop it starts. */
  iteration: z.number().int(),
  instruction: z.string(),
  items: z.array(directiveItemSchema),
  /** The fields of the kind that the common fields do not have. */
  details: z.record(z.string(), z.unknown()),
  created_at: z.iso.datetime(),
})

export type Directive = z.infer<typeof directiveSchema>
