import {
  CheckIcon,
  CircleDashedIcon,
  EllipsisIcon,
  type LucideIcon,
  SquareIcon,
  XIcon,
} from 'lucide-react'

import type { Tone } from '@/shared/lib/tone'

import { PauseSolidIcon } from './PauseSolidIcon'
import type { RunStatus } from './run-status.types'
import { ZapSolidIcon } from './ZapSolidIcon'

/** How a run status shows. */
interface RunStatusLook {
  /** The color: a review that waits stands out, a failed run reads as an error, a run that is not active reads as set aside. */
  tone: Tone
  /** One plain sign, so that two statuses of one color still look apart. */
  icon: LucideIcon
  /** Whether the user has to act after it: answer a review, or deal with a failed run. */
  needsUser: boolean
}

/**
 * How each run status shows: three dots before the run starts, a charged lightning bolt while
 * it works, pause while it waits for the user, a check, a cross, and stop for a run that was
 * stopped.
 */
export const runStatusLooks = {
  queued: { tone: 'muted', icon: EllipsisIcon, needsUser: false },
  running: { tone: 'primary', icon: ZapSolidIcon, needsUser: false },
  interrupted: { tone: 'warning', icon: PauseSolidIcon, needsUser: true },
  succeeded: { tone: 'success', icon: CheckIcon, needsUser: false },
  failed: { tone: 'destructive', icon: XIcon, needsUser: true },
  cancelled: { tone: 'muted', icon: SquareIcon, needsUser: false },
} as const satisfies Record<RunStatus, RunStatusLook>

/** How a project or a thread without a run shows: a dashed circle, a task not begun. */
export const noRunLook = {
  tone: 'muted',
  icon: CircleDashedIcon,
  needsUser: false,
} as const satisfies RunStatusLook
