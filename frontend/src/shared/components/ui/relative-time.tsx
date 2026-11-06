'use client'

import type * as React from 'react'

import { formatDateTime, formatRelativeTime, useNow } from '@/shared/lib/time'

interface RelativeTimeProps extends Omit<React.ComponentProps<'time'>, 'children' | 'dateTime'> {
  /** The moment, as the ISO string that the API gives. */
  date: string
}

/**
 * A moment as the words that people read, such as "5 min ago". The exact time sits in a title,
 * for whoever hovers, and in the `datetime` of the element, for whoever parses it. The words
 * are read again every minute, so they stay true while the page is open.
 */
function RelativeTime({ date, ...props }: RelativeTimeProps) {
  const now = useNow()

  return (
    <time data-slot="relative-time" dateTime={date} title={formatDateTime(date)} {...props}>
      {formatRelativeTime(date, now)}
    </time>
  )
}

export { RelativeTime }
