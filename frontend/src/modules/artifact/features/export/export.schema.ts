import { z } from 'zod'

import { exportFormats } from '@/modules/workflow/entities'

/** The form of an export, named after the fields of the request: a template and one of its formats. */
export const exportFormSchema = z.object({
  template: z.string().min(1),
  format: z.enum(exportFormats),
})

export type ExportFormValues = z.infer<typeof exportFormSchema>
