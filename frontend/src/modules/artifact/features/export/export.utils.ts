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

/** The file type that each template starts on: the first that it offers, by the key of the template. */
export function startFormatsOf(
  templates: readonly Pick<ExportTemplate, 'key' | 'formats'>[],
): Record<string, ExportFormat> {
  return Object.fromEntries(
    templates.flatMap(({ key, formats }) => {
      const [first] = formats
      return first === undefined ? [] : [[key, first] as const]
    }),
  )
}

/** The requests that an export form asks for: one for all the documents, else one for each chosen one, each in its own file type. */
export function exportBodiesOf({ isAll, templates, formats }: ExportFormValues): CreateExportBody[] {
  const keys = isAll ? [exportAllTemplateKey] : templates
  return keys.flatMap((template) => {
    const format = formats[template]
    return format === undefined ? [] : [{ template, format }]
  })
}
