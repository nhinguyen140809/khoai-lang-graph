'use client'

import type * as React from 'react'

import { formatDateTime, formatRelativeTime, useNow } from '@/shared/lib/time'

interface RelativeTimeProps extends Omit<React.ComponentProps<'time'>, 'children' | 'dateTime'> {
  /** The moment, as the ISO string that the API gives. */
  date: string
  /**
   * The moment to count from, when a parent reads it once for many of these, such as the rows of a
   * table: they then share one timer, and the parent decides when they read again. Without it, each
   * one keeps its own clock.
   */
  now?: Date
}

function TimeAt({ date, now, ...props }: RelativeTimeProps & { now: Date }) {
  return (
    <time data-slot="relative-time" dateTime={date} title={formatDateTime(date)} {...props}>
      {formatRelativeTime(date, now)}
    </time>
  )
}

function TimeOnItsOwnClock(props: RelativeTimeProps) {
  const now = useNow()
  return <TimeAt {...props} now={now} />
}

/**
 * A moment as the words that people read, such as "5 min ago". The exact time sits in a title,
 * for whoever hovers, and in the `datetime` of the element, for whoever parses it. The words
 * are read again every minute, so they stay true while the page is open.
 */
function RelativeTime({ now, ...props }: RelativeTimeProps) {
  return now === undefined ? <TimeOnItsOwnClock {...props} /> : <TimeAt {...props} now={now} />
}

export { RelativeTime }
