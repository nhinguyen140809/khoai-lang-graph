'use client'

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'

import { idleActivityEvents } from '../idle-visibility.constants'
import type { IdleHoldProps, IdleVisibilityOptions } from '../idle-visibility.types'

/**
 * Whether a control floating over a container is shown: it shows when it mounts (unless
 * `isInitiallyShown` is false) and on each action of the user in the container, and hides after
 * `idleMs` without one. It stays while the pointer is over it or the focus is inside it
 * (`holdProps`), and `show` shows it again, as a key that works while it is hidden does.
 */
export function useIdleVisibility(
  ref: RefObject<HTMLElement | null>,
  { idleMs, events = idleActivityEvents, isInitiallyShown = true }: IdleVisibilityOptions,
): { isShown: boolean; show: () => void; holdProps: IdleHoldProps } {
  const [isShown, setIsShown] = useState(isInitiallyShown)
  // What `isShown` holds now, for an effect that starts again and must not start a timer for a
  // hidden control.
  const shown = useRef(isInitiallyShown)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const holds = useRef(0)
  // A key, so that a new array with the same events does not listen again.
  const eventNames = events.join(' ')

  const setShown = useCallback((next: boolean) => {
    shown.current = next
    setIsShown(next)
  }, [])

  const restart = useCallback(() => {
    clearTimeout(timer.current)
    if (holds.current > 0) return
    timer.current = setTimeout(() => {
      setShown(false)
    }, idleMs)
  }, [idleMs, setShown])

  const show = useCallback(() => {
    setShown(true)
    restart()
  }, [restart, setShown])

  useEffect(() => {
    const container = ref.current
    if (shown.current) restart()
    if (container === null)
      return () => {
        clearTimeout(timer.current)
      }
    const names = eventNames === '' ? [] : eventNames.split(' ')
    // The capture phase hears an event that does not bubble, such as a scroll.
    for (const name of names)
      container.addEventListener(name, show, { capture: true, passive: true })
    return () => {
      for (const name of names) container.removeEventListener(name, show, { capture: true })
      clearTimeout(timer.current)
    }
  }, [ref, restart, show, eventNames])

  const hold = useCallback(() => {
    holds.current += 1
    setShown(true)
    clearTimeout(timer.current)
  }, [setShown])
  const release = useCallback(() => {
    holds.current = Math.max(0, holds.current - 1)
    restart()
  }, [restart])

  return {
    isShown,
    show,
    holdProps: {
      onPointerEnter: hold,
      onPointerLeave: release,
      onFocus: hold,
      onBlur: release,
    },
  }
}
