import { z } from 'zod'

import { HttpStatus } from './api-error.constants'

// The error body of the API (RFC 9457 Problem Details). Fields are optional so that an error from
// a proxy, which has no such body, still becomes an ApiError.
const problemSchema = z.object({
  title: z.string().optional(),
  code: z.string().optional(),
  detail: z.string().nullable().optional(),
  errors: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
})

export interface FieldProblem {
  field: string
  message: string
}

/** A response with an error status. `code` is the stable value to branch on, when the body has one. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string | null
  readonly fieldErrors: FieldProblem[]

  constructor(message: string, status: number, code: string | null, fieldErrors: FieldProblem[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === HttpStatus.NotFound
}

/**
 * The ApiError of an answer with an error `status` and its parsed `body`: the code and the field
 * problems of a Problem Details body, and `fallback` followed by its detail as the message. It
 * does not depend on how the request was sent.
 */
export function toApiError(status: number, body: unknown, fallback: string): ApiError {
  const problem = problemSchema.safeParse(body)
  if (!problem.success) return new ApiError(fallback, status, null, [])
  const { detail, code, errors } = problem.data
  return new ApiError(
    detail != null && detail !== '' ? `${fallback}: ${detail}` : fallback,
    status,
    code ?? null,
    errors ?? [],
  )
}
