'use client'

import { useMemo } from 'react'

import { blobShapes, eyeGaps } from '@/shared/components/face'

import { seedWhere } from '../design-system.utils'

const colorCounts = [1, 2] as const

/** The seed that gives each look that a face can have, found once: a search over seeds is not cheap. */
export function useLookSeeds() {
  return useMemo(
    () => ({
      blobs: blobShapes.map((shape) => ({
        label: shape,
        seed: seedWhere((look) => look.blobs[0].shape === shape),
      })),
      gaps: eyeGaps.map((gap) => ({ label: gap, seed: seedWhere((look) => look.gap === gap) })),
      colors: colorCounts.map((count) => ({
        label: count === 1 ? 'one color' : 'two colors',
        seed: seedWhere((look) => look.colors.length === count),
      })),
    }),
    [],
  )
}
