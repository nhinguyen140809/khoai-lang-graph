import {
  CheckIcon,
  CircleDashedIcon,
  EllipsisIcon,
  type LucideIcon,
  PauseIcon,
  SquareIcon,
  XIcon,
  ZapIcon,
} from 'lucide-react'

import type { Tone } from '@/shared/lib/tone'

import type { RunStatus } from '../types/run-status.types'

/** How a run status shows. */
interface RunStatusLook {
  /** The color: a review that waits stands out, a failed run reads as an error. */
  tone: Tone
  /** One plain sign, so that two statuses of one color still look apart. */
  icon: LucideIcon
  /** Whether the user has to act after it: answer a review, or deal with a failed run. */
  needsUser: boolean
}

/**
 * How each run status shows: three dots before the run starts, a lightning bolt while it works,
 * pause while it waits for the user, a check, a cross, and stop for a run that was stopped.
 */
export const runStatusLooks = {
  queued: { tone: 'neutral', icon: EllipsisIcon, needsUser: false },
  running: { tone: 'primary', icon: ZapIcon, needsUser: false },
  interrupted: { tone: 'warning', icon: PauseIcon, needsUser: true },
  succeeded: { tone: 'success', icon: CheckIcon, needsUser: false },
  failed: { tone: 'destructive', icon: XIcon, needsUser: true },
  cancelled: { tone: 'neutral', icon: SquareIcon, needsUser: false },
} as const satisfies Record<RunStatus, RunStatusLook>

/** How a project or a thread without a run shows: a dashed circle, a task not begun. */
export const noRunLook = {
  tone: 'neutral',
  icon: CircleDashedIcon,
  needsUser: false,
} as const satisfies RunStatusLook
