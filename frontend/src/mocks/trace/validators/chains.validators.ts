import { type TraceDirection, traceDirections } from '@/modules/trace/entities'
import type { FieldProblem } from '@/shared/api/error'

import {
  choice,
  choiceProblem,
  positiveInteger,
  positiveIntegerProblem,
} from '../../shared/http/validation'

/**
 * How far a trace goes, read from `?direction=` and `?depth=`, or the problems of the parameters.
 * Without `depth`, a trace goes `defaultDepth` links away, or as far as the links lead when that
 * is null.
 */
export function validateTraceQuery(
  params: URLSearchParams,
  defaultDepth: number | null,
): { direction: TraceDirection; depth: number | null } | { problems: FieldProblem[] } {
  const direction = choice(traceDirections, params.get('direction') ?? 'both')
  const depthText = params.get('depth')
  const depth = depthText === null ? defaultDepth : positiveInteger(Number(depthText))
  const problems: FieldProblem[] = []
  if (direction === undefined) problems.push(choiceProblem('direction'))
  if (depth === undefined) problems.push(positiveIntegerProblem('depth'))
  if (direction === undefined || depth === undefined) return { problems }
  return { direction, depth }
}
