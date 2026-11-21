'use client'

import { useEffect, useState } from 'react'

import type { RestingMood } from '../../face.types'

/**
 * Whether a face has had nothing to do in a mood that comes to rest for `delayMs`. It is not at
 * once when the mood is another, or when it is one that does not come to rest (`mood` null).
 */
export function useRested(mood: RestingMood | null, delayMs: number): boolean {
  const [restedMood, setRestedMood] = useState<RestingMood | null>(null)

  if (restedMood !== null && restedMood !== mood) setRestedMood(null)

  useEffect(() => {
    if (mood === null) return
    const timer = setTimeout(() => {
      setRestedMood(mood)
    }, delayMs)
    return () => {
      clearTimeout(timer)
    }
  }, [mood, delayMs])

  return mood !== null && restedMood === mood
}
