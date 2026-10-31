import { type Thread, threadStatuses } from '@/modules/thread/entities'
import type { FieldProblem } from '@/shared/api/error'

import {
  choice,
  choiceProblem,
  isSentButInvalid,
  requiredText,
  requiredTextProblem,
} from '../shared/http/validation'

// What the bodies of the requests that create a thread and change it may hold: a title, and the
// status of a thread. The checks are the rules of the API.

/** The title of a new thread as the body gives it: null when left out; else the problems. */
export function validateNewThread(
  given: Record<string, unknown>,
): { title: string | null } | { problems: FieldProblem[] } {
  if (given.title === undefined || given.title === null) return { title: null }
  const title = requiredText(given.title)
  return title === undefined ? { problems: [requiredTextProblem('title')] } : { title }
}

/** What a change of a thread sets, its title or its status; else the problems of the body. */
export function validateThreadChange(
  given: Record<string, unknown>,
): { change: Partial<Pick<Thread, 'title' | 'status'>> } | { problems: FieldProblem[] } {
  const title = given.title === undefined ? undefined : requiredText(given.title)
  const status = choice(threadStatuses, given.status)
  const problems: FieldProblem[] = []
  if (isSentButInvalid(given.title, requiredText)) problems.push(requiredTextProblem('title'))
  if (isSentButInvalid(given.status, (value) => choice(threadStatuses, value))) {
    problems.push(choiceProblem('status'))
  }
  if (problems.length > 0) return { problems }
  return {
    change: {
      ...(title !== undefined && { title }),
      ...(status !== undefined && { status }),
    },
  }
}
