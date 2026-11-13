import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { scrollToStartIfTall } from '@/shared/lib/viewport'
import { advanceTimers } from '@/test/steps'

import { revealDelayMs } from '../../activity-chat.constants'
import { useRevealNewMessage } from '../useRevealNewMessage'

const scroller = vi.hoisted(() => ({ end: false }))

vi.mock('@/shared/components/ui/message-scroller', () => ({
  useMessageScrollerScrollable: () => ({ start: false, end: scroller.end }),
}))
vi.mock('@/shared/lib/viewport', () => ({ scrollToStartIfTall: vi.fn() }))

describe('useRevealNewMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(scrollToStartIfTall).mockClear()
    scroller.end = false
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function arrive(ids: readonly string[] | null) {
    return renderHook(
      ({ list }) => {
        useRevealNewMessage(list)
      },
      { initialProps: { list: ids } },
    )
  }

  it('leaves the messages that are there when the chat opens, and those that load after', () => {
    const view = arrive(null)
    view.rerender({ list: ['a', 'b'] })
    advanceTimers(revealDelayMs)

    expect(scrollToStartIfTall).not.toHaveBeenCalled()
  })

  it('brings the start of a new message into view for a reader at the end, once the scroller has followed', () => {
    const view = arrive(['a'])
    view.rerender({ list: ['a', 'b'] })

    expect(scrollToStartIfTall).not.toHaveBeenCalled()
    advanceTimers(revealDelayMs)

    expect(scrollToStartIfTall).toHaveBeenCalledExactlyOnceWith('entry-b')
  })

  it('leaves a reader who has scrolled up where they are', () => {
    scroller.end = true
    const view = arrive(['a'])
    view.rerender({ list: ['a', 'b'] })
    advanceTimers(revealDelayMs)

    expect(scrollToStartIfTall).not.toHaveBeenCalled()
  })

  it('asks again for each message that arrives', () => {
    const view = arrive(['a'])
    view.rerender({ list: ['a', 'b'] })
    advanceTimers(revealDelayMs)
    view.rerender({ list: ['a', 'b', 'c'] })
    advanceTimers(revealDelayMs)

    expect(vi.mocked(scrollToStartIfTall).mock.calls.map(([id]) => id)).toEqual([
      'entry-b',
      'entry-c',
    ])
  })
})
