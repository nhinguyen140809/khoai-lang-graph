'use client'

import { useEffect, useRef } from 'react'

/**
 * Put the returned ref on an element: when `isActive` becomes true, the element scrolls into view.
 * It runs after the element mounts, so an element in a tab that opens at the same time is found.
 */
export function useScrollIntoView<T extends HTMLElement>(isActive: boolean) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (isActive) ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [isActive])
  return ref
}
