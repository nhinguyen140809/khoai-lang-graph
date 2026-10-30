import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RelativeTime } from '../relative-time'

// The times of the test are local on purpose: the words and the title format in the zone of
// the machine that runs them, and a local string reads the same in every zone.
afterEach(() => {
  vi.useRealTimers()
})

describe('RelativeTime', () => {
  it('reads the words, and names the exact time for whoever hovers or parses', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-30T10:00:00'))
    render(<RelativeTime date="2026-10-30T09:55:00" />)

    const time = screen.getByText('5 min ago')
    expect(time).toHaveAttribute('datetime', '2026-10-30T09:55:00')
    expect(time).toHaveAttribute('title', 'Oct 30, 2026, 09:55')
  })

  it('reads the words again a minute later, so they stay true', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-30T10:00:00'))
    render(<RelativeTime date="2026-10-30T09:59:00" />)

    expect(screen.getByText('1 min ago')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByText('2 min ago')).toBeInTheDocument()
  })
})
