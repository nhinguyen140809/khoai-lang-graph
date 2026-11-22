import { z } from 'zod'

import { exportFormats } from '@/modules/workflow/entities'

import { exportMessages } from './export.constants'

/**
 * The form of an export: either all the documents in one file, or the documents chosen, one file
 * each. Every document, and the file of all of them, has the file type of its own.
 */
export const exportFormSchema = z
  .object({
    isAll: z.boolean(),
    templates: z.array(z.string()),
    formats: z.record(z.string(), z.enum(exportFormats)),
  })
  .refine(({ isAll, templates }) => isAll || templates.length > 0, {
    path: ['templates'],
    message: exportMessages.chooseOne,
  })

export type ExportFormValues = z.infer<typeof exportFormSchema>
