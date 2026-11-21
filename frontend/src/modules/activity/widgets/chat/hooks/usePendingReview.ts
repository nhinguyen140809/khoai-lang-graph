'use client'

import { usePendingInterrupt } from '@/modules/review/entities'
import type { Run } from '@/modules/run/entities'

/** The review that the run on screen waits for, or null while it waits for none. */
export function usePendingReview(run: Run | null) {
  return (
    usePendingInterrupt(run?.id ?? '', { isEnabled: run !== null, runStatus: run?.status }).data ??
    null
  )
}
