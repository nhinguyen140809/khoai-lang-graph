import type { ExportFormat } from '@/modules/workflow/entities'
import type { FieldProblem } from '@/shared/api/error'
import { isOneOf, isString } from '@/shared/lib/guards'

import { findExportTemplate } from './exports.lookup'

// The template and the format that the body of POST /projects/{project_id}/exports asks for, or the
// problem of the field that the workflow does not offer.
export function validateNewExport(
  body: Record<string, unknown>,
): { template: string; format: ExportFormat } | { problems: FieldProblem[] } {
  const template = isString(body.template) ? findExportTemplate(body.template) : undefined
  if (template === undefined) {
    return { problems: [{ field: 'template', message: 'Not offered by the workflow.' }] }
  }
  if (!isOneOf(template.formats, body.format)) {
    return { problems: [{ field: 'format', message: 'Not offered by the workflow.' }] }
  }
  return { template: template.key, format: body.format }
}
