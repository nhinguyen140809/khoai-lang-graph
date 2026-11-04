import { isEmpty, isRecord } from '@/shared/lib/guards'

import type { ContentField, FieldWidget } from '../fields/content-fields.types'
import { isChoiceField, isNumberField } from '../fields/content-fields.utils'

// What each widget implies for the value of its field. Content checks look the widget up here
// instead of branching on its name, so a widget that the schema can name has its row, and
// TypeScript reports a widget without one.

interface WidgetValueRule {
  /** The value is a list: it starts empty, and is never stored as null. */
  hasListValue: boolean
  /** What is wrong with a value that is not empty, in the words of a form; null when it is fine. */
  valueProblem: (field: ContentField, value: unknown) => string | null
  /** A value that is not empty, as the API stores it. */
  toStoredValue: (value: unknown) => unknown
}

const plainValue: WidgetValueRule = {
  hasListValue: false,
  valueProblem: () => null,
  toStoredValue: (value) => value,
}

const plainList: WidgetValueRule = { ...plainValue, hasListValue: true }

// The rule of a list of entries, shared by the object list and the avatar list.
const entriesList: WidgetValueRule = { ...plainList, valueProblem: entriesProblem }

function numberProblem(field: ContentField, value: unknown): string | null {
  const number = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(number)) return 'Enter a number.'
  if (field.integer && !Number.isInteger(number)) return 'Enter a whole number.'
  if (field.minimum !== null && number < field.minimum)
    return `Enter ${String(field.minimum)} or more.`
  if (field.maximum !== null && number > field.maximum)
    return `Enter ${String(field.maximum)} or less.`
  return null
}

function selectProblem(field: ContentField, value: unknown): string | null {
  const isOffered = field.options.length === 0 || field.options.includes(String(value))
  return isOffered ? null : 'Choose one of the values.'
}

function entriesProblem(field: ContentField, value: unknown): string | null {
  if (!Array.isArray(value)) return null
  for (const entry of value) {
    const record = isRecord(entry) ? entry : {}
    for (const entryField of field.entryFields) {
      if (entryField.required && isEmpty(record[entryField.name]))
        return `Fill in "${entryField.title}" in every entry.`
    }
  }
  return null
}

// A separator is checked by the type of its field: a choice as a select, a number by its bounds.
function separatorProblem(field: ContentField, value: unknown): string | null {
  if (isChoiceField(field)) return selectProblem(field, value)
  return isNumberField(field) ? numberProblem(field, value) : null
}

export const widgetValueRules = {
  text: plainValue,
  textarea: plainValue,
  select: { ...plainValue, valueProblem: selectProblem },
  number: { ...plainValue, valueProblem: numberProblem, toStoredValue: Number },
  boolean: { ...plainValue, toStoredValue: (value) => value === true || value === 'true' },
  list: plainList,
  tags: plainList,
  'object-list': entriesList,
  separator: { ...plainValue, valueProblem: separatorProblem },
  'avatar-list': entriesList,
  badge: { ...plainValue, valueProblem: selectProblem },
} as const satisfies Record<FieldWidget, WidgetValueRule>
