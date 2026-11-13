'use client'

import { usePathname } from 'next/navigation'
import { useCallback } from 'react'

import { useScrollMemoryStore } from '../scroll-memory.store'

/** How many frames a scroller is put back for: the scroller may place itself after it shows. */
const RESTORE_FRAMES = 30

/** The events that show that the reader scrolls: from then on the scroller is left alone. */
const READER_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const

/**
 * Keeps how far a scroller was scrolled, so that a page that is left and visited again, such as the
 * page of a tab, shows what the reader was looking at. Give the function returned to the `ref` of
 * the scrolling element. The offset is kept from the start of the element, or, with `from: 'end'`,
 * from its end, which is right for a list that follows what is added at its end: a reader at its
 * end finds it at its end, and the scroller is left alone.
 *
 * The element is put back for a few frames, since it may place itself or fill up as it shows, and
 * not at all once the reader scrolls. Nothing is kept until then, so that the place the scroller
 * took for itself does not replace what was kept.
 */
export function useKeptScroll(
  name: string,
  { from = 'start' }: { from?: 'start' | 'end' } = {},
): (element: HTMLElement | null) => (() => void) | undefined {
  const key = `${usePathname()}|${name}`

  return useCallback(
    (element: HTMLElement | null) => {
      if (element === null) return undefined
      const saved = useScrollMemoryStore.getState().scrolls[key] ?? 0
      const rememberScroll = useScrollMemoryStore.getState().rememberScroll
      const maxOffset = () => element.scrollHeight - element.clientHeight
      const offsetNow = () => (from === 'end' ? maxOffset() - element.scrollTop : element.scrollTop)
      let isKeeping = saved === 0
      let frame = 0

      const keep = () => {
        if (isKeeping) rememberScroll(key, Math.max(0, offsetNow()))
      }
      const takeOver = () => {
        isKeeping = true
        cancelAnimationFrame(frame)
      }
      const putBack = (framesLeft: number) => {
        const wanted = from === 'end' ? maxOffset() - saved : saved
        const isReachable = maxOffset() >= saved
        if (isReachable && Math.abs(element.scrollTop - wanted) > 1) element.scrollTop = wanted
        if (framesLeft <= 0) {
          isKeeping = true
          return
        }
        frame = requestAnimationFrame(() => {
          putBack(framesLeft - 1)
        })
      }

      element.addEventListener('scroll', keep, { passive: true })
      for (const event of READER_EVENTS)
        element.addEventListener(event, takeOver, { passive: true })
      if (!isKeeping) putBack(RESTORE_FRAMES)

      return () => {
        cancelAnimationFrame(frame)
        element.removeEventListener('scroll', keep)
        for (const event of READER_EVENTS) element.removeEventListener(event, takeOver)
      }
    },
    [key, from],
  )
}
