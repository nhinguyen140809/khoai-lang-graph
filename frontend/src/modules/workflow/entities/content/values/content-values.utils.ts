import { isSameValue, omit } from '@/shared/lib/collections'
import { isBlank, isEmpty, isRecord } from '@/shared/lib/guards'
import { quoteRange, textOf, type TextRange } from '@/shared/lib/text'

import type { WorkflowDefinition } from '../../definition/workflow-definition.types'
import { findValueList } from '../../definition/workflow-definition.utils'
import { type ContentField, hasObjectEntries } from '../fields/content-fields.types'
import type { ContentValues } from './content-values.types'
import { widgetValueRules } from './widget-value-rules.utils'

// The values of the fields of a content, given the fields of its schema: the value a field starts
// with, how a value reads as text, what is wrong with a value, the content as the API stores it, and
// which fields two contents differ in. The fields themselves are read from the schema in
// `content-fields.utils.ts`.

/** The value a field starts with when the item has none. */
export function initialValue(field: ContentField): unknown {
  if (hasListValue(field)) return []
  return field.nullable ? null : ''
}

/** Whether the value of a field is a list: it starts empty, and is never stored as null. */
export function hasListValue(field: Pick<ContentField, 'widget'>): boolean {
  return widgetValueRules[field.widget].hasListValue
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
  fields: readonly ContentField[],
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
export function toStoredContent(
  fields: readonly ContentField[],
  content: ContentValues,
): ContentValues {
  const readOnly = fields.filter((field) => field.readOnly).map(({ name }) => name)
  const stored: ContentValues = omit(content, readOnly)
  for (const field of fields) {
    if (field.readOnly) continue
    if (!(field.name in content)) continue
    const value = content[field.name]
    const rule = widgetValueRules[field.widget]
    if (!isEmpty(value)) stored[field.name] = rule.toStoredValue(value)
    else if (field.nullable && !hasListValue(field)) stored[field.name] = null
  }
  return stored
}

/** The names of the fields whose value differs between two contents, read only fields left out. */
export function changedFields(
  fields: readonly ContentField[],
  before: ContentValues,
  after: ContentValues,
): string[] {
  return contentChanges(
    fields.filter((field) => !field.readOnly),
    before,
    after,
  ).map(({ field }) => field.name)
}

/**
 * The fields whose value differs between two contents, read only fields included, with both
 * values: what a version changed, shown as a diff.
 */
export function contentChanges(
  fields: readonly ContentField[],
  before: ContentValues,
  after: ContentValues,
): { field: ContentField; before: unknown; after: unknown }[] {
  return fields
    .filter((field) => !isSameValue(before[field.name] ?? null, after[field.name] ?? null))
    .map((field) => ({
      field,
      before: before[field.name] ?? null,
      after: after[field.name] ?? null,
    }))
}

/**
 * The content without the entries that hold nothing: a blank entry of a `list` or `tags` field,
 * and an entry of an `object-list` or a `rating-list` whose every field is empty. Other fields stay as they are.
 */
export function withoutEmptyEntries(
  fields: readonly ContentField[],
  content: ContentValues,
): ContentValues {
  const kept: ContentValues = { ...content }
  for (const field of fields) {
    const value = kept[field.name]
    if (!hasEntryList(field) || !Array.isArray(value)) continue
    kept[field.name] = value.filter((entry) => isEntryFilled(field, entry))
  }
  return kept
}

/** Whether a field is a list of entries that may be left blank: a `list`, `tags`, `object-list` or `rating-list`. */
function hasEntryList(field: Pick<ContentField, 'widget'>): boolean {
  return field.widget === 'list' || field.widget === 'tags' || hasObjectEntries(field.widget)
}

/** Whether an entry holds anything: a text that is not blank, or an object with a field that is not empty. */
function isEntryFilled(field: ContentField, entry: unknown): boolean {
  if (!hasObjectEntries(field.widget)) return !isBlank(entry)
  return isRecord(entry) && field.entryFields.some(({ name }) => !isEmpty(entry[name]))
}

/**
 * Where the words of a quote sit in a content: the first `text` or `textarea` field that holds
 * them, in the order of the fields given (the main field first); a `list` entry is not searched.
 * Null when no field holds them.
 */
export function findQuote(
  fields: readonly ContentField[],
  content: ContentValues,
  quote: string,
): { field: string; range: TextRange } | null {
  for (const field of fields) {
    if (field.widget !== 'text' && field.widget !== 'textarea') continue
    const range = quoteRange(textOf(content[field.name]), quote)
    if (range !== null) return { field: field.name, range }
  }
  return null
}

/**
 * The title that the definition gives a value of a value list, such as "Must" for `must`; the
 * value itself when the field names no list, the definition has not loaded or the list lacks it.
 */
export function valueTitle(
  field: Pick<ContentField, 'valueList'>,
  value: string,
  definition: Pick<WorkflowDefinition, 'value_lists'> | undefined,
): string {
  if (field.valueList === null || definition === undefined) return value
  return (
    findValueList(definition, field.valueList)?.values.find(({ key }) => key === value)?.title ??
    value
  )
}
