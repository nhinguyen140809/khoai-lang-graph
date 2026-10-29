import { z } from 'zod'

// Temporary hand-written schemas for the export templates of the workflow definition.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** The file formats an export can produce. */
export const exportFormats = ['markdown', 'pdf', 'docx', 'csv', 'json'] as const

export type ExportFormat = (typeof exportFormats)[number]

/** A document that a project can export: the artifact kinds it is built from and the formats it offers. */
export const exportTemplateSchema = z.object({
  key: z.string(),
  title: z.string(),
  /** The kinds of the artifacts that the document is built from. */
  artifact_kinds: z.array(z.string()),
  formats: z.array(z.enum(exportFormats)),
})

export type ExportTemplate = z.infer<typeof exportTemplateSchema>
