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
