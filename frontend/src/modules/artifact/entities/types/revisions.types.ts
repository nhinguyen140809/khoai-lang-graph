import { z } from 'zod'

import { contentValuesSchema } from '@/modules/workflow/entities/@x/artifact'

import { originSchema } from './artifacts.types'

// Temporary hand-written schemas for the revisions of artifacts and items.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

const changeReasons = [
  'generated',
  'user_edit',
  'rework',
  'reviewed',
  'restored',
  'deleted',
] as const

export type ChangeReason = (typeof changeReasons)[number]

/** One version of an artifact or of an item. */
export const revisionSchema = z.object({
  version: z.number().int(),
  change_reason: z.enum(changeReasons),
  changed_by: originSchema,
  created_at: z.iso.datetime(),
  /** The content at this version, to compare it with the next one. */
  content: contentValuesSchema,
})

export type Revision = z.infer<typeof revisionSchema>
