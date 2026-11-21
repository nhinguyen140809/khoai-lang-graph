import {
  CheckIcon,
  CircleDashedIcon,
  EllipsisIcon,
  type LucideIcon,
  SquareIcon,
  XIcon,
} from 'lucide-react'

import { SpinningIcon } from '@/shared/components/animation/icon'
import type { Mood } from '@/shared/components/face'
import { DotIcon, ExclamationIcon } from '@/shared/components/icon'
import type { Tone } from '@/shared/lib/tone'
import type { ByView } from '@/shared/lib/view'

import { PauseSolidIcon } from './PauseSolidIcon'
import type { RunStatus } from './run-status.types'
import { ZapSolidIcon } from './ZapSolidIcon'

/** How a run status shows. */
interface RunStatusLook {
  /** The color: a review that waits stands out, a failed run reads as an error, a run that is not active reads as set aside. */
  tone: ByView<Tone>
  /** How the face of the agent looks while the run is in this status. */
  mood: Mood
  /** One plain sign, so that two statuses of one color still look apart. */
  icon: ByView<LucideIcon>
  /** Whether the user has to act after it: answer a review, or deal with a failed run. */
  needsUser: boolean
}

/**
 * How each run status shows. The developer view: three dots before the run starts, a charged
 * lightning bolt while it works, pause while it waits for the user, a check, a cross, and stop for
 * a run that was stopped. The user view has signs of its own for the statuses that it shows in its
 * lists: a spinner while the run starts or works, a dot where it waits for the user, and an alert
 * where it failed.
 */
export const runStatusLooks = {
  queued: {
    tone: { developer: 'muted', user: 'primary' },
    mood: 'idle',
    icon: { developer: EllipsisIcon, user: SpinningIcon },
    needsUser: false,
  },
  running: {
    tone: { developer: 'primary' },
    mood: 'working',
    icon: { developer: ZapSolidIcon, user: SpinningIcon },
    needsUser: false,
  },
  interrupted: {
    tone: { developer: 'warning' },
    mood: 'waiting',
    icon: { developer: PauseSolidIcon, user: DotIcon },
    needsUser: true,
  },
  succeeded: {
    tone: { developer: 'success' },
    mood: 'happy',
    icon: { developer: CheckIcon },
    needsUser: false,
  },
  failed: {
    tone: { developer: 'destructive' },
    mood: 'worried',
    icon: { developer: XIcon, user: ExclamationIcon },
    needsUser: true,
  },
  cancelled: {
    tone: { developer: 'muted' },
    mood: 'sleeping',
    icon: { developer: SquareIcon },
    needsUser: false,
  },
} as const satisfies Record<RunStatus, RunStatusLook>

/** How a project or a thread without a run shows: a dashed circle, a task not begun. */
export const noRunLook = {
  tone: { developer: 'muted' },
  mood: 'idle',
  icon: { developer: CircleDashedIcon },
  needsUser: false,
} as const satisfies RunStatusLook
