import type { ExportTemplate } from './export-templates.types'

/**
 * The templates that hold the kind of a document, the most specific first (the fewest kinds), then
 * in the order of the definition.
 */
export function exportTemplatesOf(
  templates: readonly ExportTemplate[],
  kind: string,
): ExportTemplate[] {
  return templates
    .filter(({ artifact_kinds: kinds }) => kinds.includes(kind))
    .toSorted((first, second) => first.artifact_kinds.length - second.artifact_kinds.length)
}
