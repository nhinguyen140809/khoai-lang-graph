'use client'

import { useEffect, useState } from 'react'

/**
 * Whether the component has been on screen for a frame. It is false while the first render is
 * painted, so that what shows then stays still, and true after, so that what mounts later can
 * come in with a motion.
 */
export function useHasPainted(): boolean {
  const [hasPainted, setHasPainted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setHasPainted(true)
    })
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [])

  return hasPainted
}
