import { differenceInCalendarDays, differenceInMinutes, format, isSameYear } from 'date-fns'

/**
 * A past time relative to `now`, in the short form of activity lists: "just now", "2 min ago",
 * "5 h ago", "yesterday", "3 days ago", then the date.
 */
export function formatRelativeTime(iso: string, now: Date): string {
  const date = new Date(iso)
  const minutes = differenceInMinutes(now, date)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${String(minutes)} min ago`
  const days = differenceInCalendarDays(now, date)
  if (days === 0) return `${String(Math.floor(minutes / 60))} h ago`
  if (days === 1) return 'yesterday'
  if (days < 7) return `${String(days)} days ago`
  return format(date, isSameYear(date, now) ? 'MMM d' : 'MMM d, yyyy')
}

/** A date with its year, as "Oct 1, 2026". */
export function formatDate(value: string | Date): string {
  return format(new Date(value), 'MMM d, yyyy')
}

/** A date and the time of day, as "Oct 1, 2026, 14:05". */
export function formatDateTime(value: string | Date): string {
  return format(new Date(value), 'MMM d, yyyy, HH:mm')
}

const SECOND = 1000
const MINUTE_SECONDS = 60
const HOUR_SECONDS = 3600

/**
 * How long something took: "850 ms", "4.2 s", "12 s", "2 min 5 s", "1 h 4 min". A unit that is
 * zero after a larger one is left out, and a negative length reads as zero. The length is rounded
 * once, to the unit it is written in, so that 59.6 seconds reads "1 min" and never "60 s".
 */
export function formatDuration(ms: number): string {
  const whole = Math.round(Math.max(0, ms))
  if (whole < SECOND) return `${String(whole)} ms`
  const tenths = Math.round(whole / 100)
  if (tenths < 100) return `${(tenths / 10).toFixed(1)} s`
  const seconds = Math.round(whole / SECOND)
  if (seconds < MINUTE_SECONDS) return `${String(seconds)} s`
  if (seconds < HOUR_SECONDS) {
    const rest = seconds % MINUTE_SECONDS
    const minutes = String(Math.floor(seconds / MINUTE_SECONDS))
    return rest === 0 ? `${minutes} min` : `${minutes} min ${String(rest)} s`
  }
  const totalMinutes = Math.round(seconds / MINUTE_SECONDS)
  const hours = String(Math.floor(totalMinutes / MINUTE_SECONDS))
  const rest = totalMinutes % MINUTE_SECONDS
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest)} min`
}
