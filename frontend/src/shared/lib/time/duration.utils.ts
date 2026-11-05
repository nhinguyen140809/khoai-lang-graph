import { minuteMs } from './duration.constants'
import type { RoundedDuration } from './duration.types'

/** The milliseconds from one time to another, as the API writes them. */
export function msBetween(from: string, to: string): number {
  return Date.parse(to) - Date.parse(from)
}

/**
 * A duration in whole minutes, for words: under a minute, the minutes, or the hours and the minutes.
 */
export function roundedDuration(ms: number): RoundedDuration {
  if (ms < minuteMs) return { kind: 'lessThanAMinute' }
  const totalMinutes = Math.floor(ms / minuteMs)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return { kind: 'minutes', minutes }
  return { kind: 'hours', hours, minutes }
}
