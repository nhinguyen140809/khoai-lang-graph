import type { ExportFormat } from './export-templates.types'

/** The words of each file format of an export, the same in both views. */
export const exportFormatLabels = {
  markdown: 'Markdown',
  pdf: 'PDF',
  docx: 'Word',
  csv: 'CSV',
  json: 'JSON',
} as const satisfies Record<ExportFormat, string>
