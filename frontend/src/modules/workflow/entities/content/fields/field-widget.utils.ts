import { isOneOf } from '@/shared/lib/guards'

import { type ContentField, oneLineWidgets } from './content-fields.types'

/** Whether a field offers values to choose from: an enum, a value list or the values of another artifact. */
export function isChoiceField(
  field: Pick<ContentField, 'options' | 'valueList' | 'allowedValuesFrom'>,
): boolean {
  return field.options.length > 0 || field.valueList !== null || field.allowedValuesFrom !== null
}

/** Whether the value of a field is a number, whatever its widget: the schema made it an integer or bounded it. */
export function isNumberField(
  field: Pick<ContentField, 'integer' | 'minimum' | 'maximum'>,
): boolean {
  return field.integer || field.minimum !== null || field.maximum !== null
}

/** Whether the value of a field reads on one line: its widget is one of `oneLineWidgets`. */
export function isOneLineField(field: Pick<ContentField, 'widget'>): boolean {
  return isOneOf(oneLineWidgets, field.widget)
}

/** Whether a field marks a place of a sequence: its widget is `separator`. */
export function isSeparatorField(field: Pick<ContentField, 'widget'>): boolean {
  return field.widget === 'separator'
}
