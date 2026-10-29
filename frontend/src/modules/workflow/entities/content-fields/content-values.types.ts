import { z } from 'zod'

/** The values of the fields of the content of an artifact or an item, by the name of the field. */
export const contentValuesSchema = z.record(z.string(), z.unknown())

export type ContentValues = z.infer<typeof contentValuesSchema>
