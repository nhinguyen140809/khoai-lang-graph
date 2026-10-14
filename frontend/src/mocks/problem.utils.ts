import { HttpResponse } from 'msw'

import type { FieldProblem } from '@/shared/api/api-fetch.utils'

/** An error response in the Problem Details format of the API. */
export function problem(
  status: number,
  code: string,
  title: string,
  detail: string | null = null,
  errors: FieldProblem[] = [],
) {
  return HttpResponse.json(
    { type: 'about:blank', title, status, code, detail, errors },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

export function notFound(what: string) {
  return problem(404, 'not_found', 'Not found', `${what} does not exist.`)
}
