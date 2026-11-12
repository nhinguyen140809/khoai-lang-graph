'use client'

import { useEffect, useState } from 'react'

/**
 * Whether content that comes and goes is still in the page: it is from the moment it is asked for
 * until `duration` after it is not, so that its exit has time to play.
 */
export function usePresence(isPresent: boolean, duration: number): boolean {
  const [isMounted, setIsMounted] = useState(isPresent)

  if (isPresent && !isMounted) setIsMounted(true)

  useEffect(() => {
    if (isPresent) return
    const timer = setTimeout(() => {
      setIsMounted(false)
    }, duration)
    return () => {
      clearTimeout(timer)
    }
  }, [isPresent, duration])

  return isMounted
}
