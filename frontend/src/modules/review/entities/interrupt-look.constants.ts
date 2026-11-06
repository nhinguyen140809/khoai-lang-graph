import { CircleAlertIcon, CircleCheckIcon, CircleStopIcon, type LucideIcon } from 'lucide-react'

import type { Tone } from '@/shared/lib/tone'

import type { InterruptStatus } from './interrupts.types'

/** How an interrupt status shows. */
interface InterruptStatusLook {
  /** The color: a review that waits stands out, an answered one reads as settled. */
  tone: Tone
  /** One plain sign, without a box around it. */
  icon: LucideIcon
}

/** How each interrupt status shows: a review that waits, one that was answered, one dropped. */
export const interruptStatusLooks = {
  pending: { tone: 'warning', icon: CircleAlertIcon },
  resolved: { tone: 'success', icon: CircleCheckIcon },
  cancelled: { tone: 'neutral', icon: CircleStopIcon },
} as const satisfies Record<InterruptStatus, InterruptStatusLook>
