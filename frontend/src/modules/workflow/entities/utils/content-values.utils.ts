import { isSameValue, omit } from '@/shared/lib/collections'
import { isBlank, isEmpty } from '@/shared/lib/guards'

import type { ContentField } from '../types/content-fields.types'
import type { ContentValues } from '../types/content-values.types'
import { widgetValueRules } from './widget-value-rules.utils'

// The values of the fields of a content, given the fields of its schema: the value a field starts
// with, how a value reads as text, what is wrong with a value, the content as the API stores it, and
// which fields two contents differ in. The fields themselves are read from the schema in
// `content-fields.utils.ts`.

/** The value a field starts with when the item has none. */
export function initialValue(field: ContentField): unknown {
  if (widgetValueRules[field.widget].hasListValue) return []
  return field.nullable ? null : ''
}

/** The problem with a value, in the words of a form, or null when the value is fine. */
function fieldProblem(field: ContentField, value: unknown): string | null {
  // An empty list is a value; only a missing or blank value is not.
  if (field.required && !field.nullable && isBlank(value)) return 'Enter a value.'
  if (field.minItems !== null && Array.isArray(value) && value.length < field.minItems) {
    return field.minItems === 1
      ? 'Add an entry.'
      : `Add at least ${String(field.minItems)} entries.`
  }
  if (isEmpty(value)) return null
  return widgetValueRules[field.widget].valueProblem(field, value)
}

/** The problems of a content against the fields of its schema, by field name. */
export function validateContent(
  fields: ContentField[],
  content: ContentValues,
): Record<string, string> {
  const problems: Record<string, string> = {}
  for (const field of fields) {
    if (field.readOnly) continue
    const problem = fieldProblem(field, content[field.name])
    if (problem !== null) problems[field.name] = problem
  }
  return problems
}

/**
 * The content as the API stores it: numbers as numbers, an empty nullable field as null. A field
 * that the content does not hold stays out, so that a change sets only the fields it names.
 */
export function toStoredContent(fields: ContentField[], content: ContentValues): ContentValues {
  const readOnly = fields.filter((field) => field.readOnly).map(({ name }) => name)
  const stored: ContentValues = omit(content, readOnly)
  for (const field of fields) {
    if (field.readOnly) continue
    if (!(field.name in content)) continue
    const value = content[field.name]
    const rule = widgetValueRules[field.widget]
    if (!isEmpty(value)) stored[field.name] = rule.toStoredValue(value)
    else if (field.nullable && !rule.hasListValue) stored[field.name] = null
  }
  return stored
}

/** The names of the fields whose value differs between two contents. */
export function changedFields(
  fields: ContentField[],
  before: ContentValues,
  after: ContentValues,
): string[] {
  return fields
    .filter((field) => !field.readOnly)
    .filter((field) => !isSameValue(before[field.name] ?? null, after[field.name] ?? null))
    .map((field) => field.name)
}
