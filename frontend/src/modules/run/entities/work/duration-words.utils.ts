import { roundedDuration } from '@/shared/lib/time'

import { workMessages } from './work.constants'

/** The words of how long a line of work took, in the user view. */
export function durationWords(durationMs: number): string {
  const duration = roundedDuration(durationMs)
  if (duration.kind === 'lessThanAMinute') return workMessages.took.lessThanAMinute
  if (duration.kind === 'minutes') return workMessages.took.minutes(duration.minutes)
  return workMessages.took.hours(duration.hours, duration.minutes)
}
