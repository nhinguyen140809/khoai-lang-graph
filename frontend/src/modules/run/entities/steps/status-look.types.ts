import type { LucideIcon } from 'lucide-react'

import type { Spinner } from '@/shared/components/ui/spinner'
import type { Tone } from '@/shared/lib/tone'

/** The mark of a status: an icon component, or nothing to show a number instead. */
type StatusMark = LucideIcon | typeof Spinner | null

/** How a status of a stage or of a line of work shows. */
export interface StatusLook {
  /** The color of the mark of the status. */
  tone: Tone
  /** One plain sign, without a box around it; the running mark spins. */
  icon: StatusMark
  /** Whether the user has to act after it. */
  needsUser: boolean
  /** Whether the work ended in success. */
  isCompleted: boolean
  /** Whether the work ended in failure. */
  isFailed: boolean
  /** Whether the work is the one in progress. */
  isLoading: boolean
  /** Whether the work waits for the user. */
  isWaiting: boolean
  /** Whether the work has not started. */
  isNotStarted: boolean
}
