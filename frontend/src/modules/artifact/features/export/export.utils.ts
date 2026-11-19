import type { CreateExportBody } from '@/modules/artifact/entities'
import {
  type ExportFormat,
  exportFormatLabels,
  type ExportTemplate,
} from '@/modules/workflow/entities'

import { exportAllTemplateKey, exportMessages } from './export.constants'
import type { ExportFormValues } from './export.schema'

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

/** What a document of an export holds, in a line: the titles of the kinds of document it is built from. */
export function exportContents(
  template: Pick<ExportTemplate, 'artifact_kinds'>,
  kindTitles: ReadonlyMap<string, string>,
): string {
  return exportMessages.contents(
    template.artifact_kinds.map((kind) => kindTitles.get(kind) ?? kind),
  )
}

/** The file types that every one of the templates offers, in the order of the first. */
export function commonFormats(
  templates: readonly Pick<ExportTemplate, 'formats'>[],
): ExportFormat[] {
  const [first, ...rest] = templates
  if (first === undefined) return []
  return first.formats.filter((format) => rest.every(({ formats }) => formats.includes(format)))
}

/** The requests that an export form asks for: one for all the documents, else one for each chosen one. */
export function exportBodiesOf({ isAll, templates, format }: ExportFormValues): CreateExportBody[] {
  if (isAll) return [{ template: exportAllTemplateKey, format }]
  return templates.map((template) => ({ template, format }))
}
