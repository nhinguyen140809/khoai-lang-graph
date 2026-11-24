'use client'

import { useState } from 'react'

import type { EyeShape } from '../human-face.types'

/** What tells one drawing of an eye from another. */
export function shapeKeyOf({ variant, isFlipped }: EyeShape): string {
  return `${variant}${isFlipped ? '-up' : ''}`
}

/**
 * The eye to show and the one that it replaces, so that one eye fades into the other: `from` is the
 * eye that was shown before the last change, none until the eye has changed once.
 */
export function useEyeFade(target: EyeShape): { from: EyeShape | null; to: EyeShape } {
  const [shown, setShown] = useState<{ from: EyeShape | null; to: EyeShape }>({
    from: null,
    to: target,
  })
  if (shapeKeyOf(shown.to) !== shapeKeyOf(target)) setShown({ from: shown.to, to: target })
  return shown
}
