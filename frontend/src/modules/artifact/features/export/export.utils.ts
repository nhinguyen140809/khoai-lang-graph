import {
  type ExportFormat,
  exportFormatLabels,
  type ExportTemplate,
} from '@/modules/workflow/entities'

import { exportMessages } from './export.constants'

/**
 * The name of the file in the words of the user: the title of its template and the label of its
 * format, such as "Requirement specification (PDF)".
 */
export function exportFileLabel(
  template: Pick<ExportTemplate, 'title'> | undefined,
  format: ExportFormat,
): string {
  return `${template?.title ?? exportMessages.unknownFile} (${exportFormatLabels[format]})`
}

/** The id of the toast that follows one export, which each of its states replaces. */
export function exportToastId(exportId: string): string {
  return `export:${exportId}`
}
