import type { ExportFormat } from '@/modules/workflow/entities'

/** How long the mock server takes to prepare the file of an export. */
export const exportReadyAfterMs = 1500

/** The extension of the file name of an export in each format; a format not listed is its own. */
export const exportFileExtensions: Partial<Record<ExportFormat, string>> = { markdown: 'md' }
