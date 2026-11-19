import { z } from 'zod'

import { exportFormats } from '@/modules/workflow/entities'

import { exportMessages } from './export.constants'

/**
 * The form of an export: either all the documents in one file, or the documents chosen, one file
 * each, in one file type that all of them offer.
 */
export const exportFormSchema = z
  .object({
    isAll: z.boolean(),
    templates: z.array(z.string()),
    format: z.enum(exportFormats),
  })
  .refine(({ isAll, templates }) => isAll || templates.length > 0, {
    path: ['templates'],
    message: exportMessages.chooseOne,
  })

export type ExportFormValues = z.infer<typeof exportFormSchema>
