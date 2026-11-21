'use client'

import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react'

import { useIsInView } from '@/shared/lib/viewport'

import type { OlderRuns } from '../chat-state.types'

/** How far above the top of the chat the marker counts as near, so that the earlier runs load before the reader gets to them. */
const nearMargin = '400px'

/** How long the marker has to stay near before the runs load, so that a chat that opens at its top and goes to its end at once loads nothing it does not need, in milliseconds. */
const nearDelayMs = 150

/** The viewport that scrolls the chat, which the marker sits in. */
function viewportOf(marker: Element | null): HTMLElement | null {
  return marker?.closest<HTMLElement>('[data-slot="message-scroller-viewport"]') ?? null
}

/**
 * Loads the runs before the ones the chat shows when a marker at its top comes near, and keeps the
 * reader where they were while those runs come in above: the scroll moves down by what was added,
 * unless the browser has already kept the place by itself.
 */
export function useLoadOlderRuns(
  marker: RefObject<Element | null>,
  { hasMore, isLoading, isError, load }: OlderRuns,
  firstRunId: string | null,
) {
  const isNear = useIsInView(marker, { margin: nearMargin, initial: false })
  const lastSeen = useRef({ top: 0, height: 0, firstRunId })

  useEffect(() => {
    if (!isNear || !hasMore || isLoading || isError) return
    const timer = setTimeout(load, nearDelayMs)
    return () => {
      clearTimeout(timer)
    }
  }, [isNear, hasMore, isLoading, isError, load])

  useEffect(() => {
    const viewport = viewportOf(marker.current)
    if (viewport === null) return
    const remember = () => {
      lastSeen.current = {
        top: viewport.scrollTop,
        height: viewport.scrollHeight,
        firstRunId: lastSeen.current.firstRunId,
      }
    }
    viewport.addEventListener('scroll', remember, { passive: true })
    return () => {
      viewport.removeEventListener('scroll', remember)
    }
  }, [marker])

  useLayoutEffect(() => {
    const viewport = viewportOf(marker.current)
    if (viewport === null) return
    const before = lastSeen.current
    if (before.firstRunId !== null && before.firstRunId !== firstRunId) {
      const expected = before.top + (viewport.scrollHeight - before.height)
      if (viewport.scrollTop < expected - 1) viewport.scrollTop = expected
    }
    lastSeen.current = { top: viewport.scrollTop, height: viewport.scrollHeight, firstRunId }
  })
}
