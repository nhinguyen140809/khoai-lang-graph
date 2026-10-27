import type { FieldProblem } from '@/shared/api/error'
import { hasText, isOneOf, isRecord, isString } from '@/shared/lib/guards'

// How the mock server reads one field of a body. A reader gives the value when the field is right
// and undefined when it is wrong; each reader has a function that gives the problem of the field.

/** A text field that may be left out: null when it is left out, undefined when it is not text. */
export function optionalText(value: unknown): string | null | undefined {
  if (value == null) return null
  return isString(value) ? value : undefined
}

/** The problem of a field that is not text, where leaving it out is allowed. */
export function optionalTextProblem(field: string): FieldProblem {
  return { field, message: 'Enter text, or nothing.' }
}

/** A whole number from 1, or undefined for any other value. */
export function positiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 ? value : undefined
}

/** The problem of a field that is not a whole number from 1. */
export function positiveIntegerProblem(field: string): FieldProblem {
  return { field, message: 'Enter a number from 1.' }
}

/** A text with a word in it, without the space around it, or undefined for any other value. */
export function requiredText(value: unknown): string | undefined {
  return isString(value) && hasText(value) ? value.trim() : undefined
}

/** The problem of a field that is not a text with a word in it. */
export function requiredTextProblem(field: string): FieldProblem {
  return { field, message: 'Enter a value.' }
}

/** One of the values of a list, or undefined for any other value. */
export function choice<T>(values: readonly T[], value: unknown): T | undefined {
  return isOneOf(values, value) ? value : undefined
}

/** The problem of a field that is none of the values of a list. */
export function choiceProblem(field: string): FieldProblem {
  return { field, message: 'Choose one of the values.' }
}

/** An object, such as the content of an artifact, or undefined for any other value. */
export function jsonObject(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

/** The problem of a field that is not an object. */
export function jsonObjectProblem(field: string): FieldProblem {
  return { field, message: 'Send an object.' }
}

/** true or false, or undefined for any other value. */
export function jsonBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

/** The problem of a field that is not true or false. */
export function jsonBooleanProblem(field: string): FieldProblem {
  return { field, message: 'Send true or false.' }
}

/** Whether a field that was sent is wrong. A field left out is not wrong: the reader is not asked. */
export function isSentButInvalid(value: unknown, read: (value: unknown) => unknown): boolean {
  return value !== undefined && read(value) === undefined
}
