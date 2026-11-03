import { z } from 'zod'

import { type ExportFormat, exportFormats } from '@/modules/workflow/entities/@x/artifact'

import { artifactRefSchema } from '../artifacts/artifacts.types'

// Temporary hand-written schemas for the exports API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

export const exportStatuses = ['pending', 'ready', 'failed'] as const

export type ExportStatus = (typeof exportStatuses)[number]

/** A document built from the artifacts of a project: `pending` while its file is prepared. */
export const exportSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  template: z.string(),
  format: z.enum(exportFormats),
  status: z.enum(exportStatuses),
  file_name: z.string(),
  size_bytes: z.number().int().nullable(),
  /** Present when the export is ready; valid for a limited time. */
  download_url: z.string().nullable(),
  /** The user who asked for the document. */
  requested_by: z.string(),
  /** The artifacts of the document, at the exact version that went into it. */
  included_artifacts: z.array(artifactRefSchema),
  created_at: z.iso.datetime(),
})

export type Export = z.infer<typeof exportSchema>

/** The body that asks for an export: one of the templates of the workflow, in one of its formats. */
export interface CreateExportBody {
  template: string
  format: ExportFormat
}
