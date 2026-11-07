'use client'

import { useView } from '@/shared/lib/view'

import { interruptStatusLooks } from '../interrupt-look.constants'
import { interruptStatusLabels } from '../interrupts.constants'
import type { InterruptStatus } from '../interrupts.types'

/** How an interrupt status shows, with its label in the view of the app. */
export function useInterruptStatusLook(status: InterruptStatus) {
  return { ...interruptStatusLooks[status], label: interruptStatusLabels[status][useView()] }
}
