import { z } from 'zod'

// Temporary hand-written schemas for the source documents API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** The formats of file that a source can be, which the upload accepts. */
export const sourceFormats = ['txt', 'md', 'html', 'json'] as const

export type SourceFormat = (typeof sourceFormats)[number]

/** A file that the user uploaded as research for the personas, as its upload left it. */
export const sourceSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  /** Taken from the name of the file when the upload gave none. */
  title: z.string(),
  /** The name of the file of the first upload. */
  filename: z.string(),
  format: z.enum(sourceFormats),
  /** The newest of its versions, from 1. */
  latest_version: z.number().int(),
  created_at: z.iso.datetime(),
})

export type Source = z.infer<typeof sourceSchema>
