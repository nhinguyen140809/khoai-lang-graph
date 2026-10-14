import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'
import { z } from 'zod'

import { ApiError, type FieldProblem } from '@/shared/api/api-error.utils'

// A form names its fields after the fields of its request, so that a problem of a field that the
// API answers, such as `run_config.max_steps`, is the path of a field of the form.

// The schema of the field at `path` in `schema`, through objects, records and empty values.
function schemaAt(schema: z.ZodType, path: string[]): z.ZodType | undefined {
  const [head, ...rest] = path
  if (head === undefined) return schema
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return schemaAt(schema.unwrap() as z.ZodType, path)
  }
  if (schema instanceof z.ZodObject) {
    const shape: Record<string, z.ZodType | undefined> = schema.shape
    const child = Object.hasOwn(shape, head) ? shape[head] : undefined
    return child === undefined ? undefined : schemaAt(child, rest)
  }
  if (schema instanceof z.ZodRecord) return schemaAt(schema.valueType as z.ZodType, rest)
  return undefined
}

/** The problems of a failed request that name a field of the form that `schema` describes. */
export function fieldProblemsOf(error: unknown, schema: z.ZodType): FieldProblem[] {
  if (!(error instanceof ApiError)) return []
  return error.fieldErrors.filter(({ field }) => schemaAt(schema, field.split('.')) !== undefined)
}

/** Shows the problems of a failed request at the fields of the form that they name. */
export function showFieldProblems<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: unknown,
  schema: z.ZodType,
) {
  for (const { field, message } of fieldProblemsOf(error, schema)) {
    setError(field as FieldPath<T>, { message })
  }
}

/**
 * What a form says under it when its request fails: nothing when the problems are shown at their
 * fields, the message of the error otherwise, also for a problem of a field that the form lacks.
 */
export function formErrorOf(error: unknown, schema: z.ZodType): string | null {
  if (error === null || error === undefined) return null
  if (fieldProblemsOf(error, schema).length > 0) return null
  return error instanceof Error ? error.message : 'Something went wrong.'
}
