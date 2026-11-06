import {
  CheckIcon,
  CircleAlertIcon,
  CirclePauseIcon,
  CircleStopIcon,
  CircleXIcon,
  type LucideIcon,
  XIcon,
} from 'lucide-react'

import { Spinner } from '@/shared/components/ui/spinner'
import type { Tone } from '@/shared/lib/tone'

import type { WorkStatus } from './run-steps.types'
import type { StageStatus } from './stage-progress.types'

/** The mark of a status: an icon component, or nothing to show a number instead. */
type StatusMark = LucideIcon | typeof Spinner | null

/** How a status of a stage or of a line of work shows. */
interface StatusLook {
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

/** How each status of a stage or of a subject shows, as Progress marks it. */
export const stageStatusLooks = {
  done: {
    tone: 'success',
    icon: CheckIcon,
    needsUser: false,
    isCompleted: true,
    isFailed: false,
    isLoading: false,
    isWaiting: false,
    isNotStarted: false,
  },
  running: {
    tone: 'primary',
    icon: Spinner,
    needsUser: false,
    isCompleted: false,
    isFailed: false,
    isLoading: true,
    isWaiting: false,
    isNotStarted: false,
  },
  waiting: {
    tone: 'warning',
    icon: CircleAlertIcon,
    needsUser: true,
    isCompleted: false,
    isFailed: false,
    isLoading: false,
    isWaiting: true,
    isNotStarted: false,
  },
  failed: {
    tone: 'destructive',
    icon: CircleXIcon,
    needsUser: true,
    isCompleted: false,
    isFailed: true,
    isLoading: false,
    isWaiting: false,
    isNotStarted: false,
  },
  stopped: {
    tone: 'neutral',
    icon: CircleStopIcon,
    needsUser: false,
    isCompleted: false,
    isFailed: false,
    isLoading: false,
    isWaiting: false,
    isNotStarted: false,
  },
  not_started: {
    tone: 'neutral',
    icon: null,
    needsUser: false,
    isCompleted: false,
    isFailed: false,
    isLoading: false,
    isWaiting: false,
    isNotStarted: true,
  },
} as const satisfies Record<StageStatus, StatusLook>

/** How each status of a line of work shows, as the trace of the chat draws it. */
export const workStatusLooks = {
  running: {
    tone: 'primary',
    /** The `status` of the trace line of the library, which shimmers its title while it runs. */
    traceStatus: 'running',
    icon: Spinner,
    needsUser: false,
    isCompleted: false,
    isFailed: false,
    isLoading: true,
    isWaiting: false,
    isNotStarted: false,
  },
  waiting: {
    tone: 'warning',
    traceStatus: null,
    icon: CirclePauseIcon,
    needsUser: true,
    isCompleted: false,
    isFailed: false,
    isLoading: false,
    isWaiting: true,
    isNotStarted: false,
  },
  stopped: {
    tone: 'neutral',
    traceStatus: null,
    icon: CircleStopIcon,
    needsUser: false,
    isCompleted: false,
    isFailed: false,
    isLoading: false,
    isWaiting: false,
    isNotStarted: false,
  },
  done: {
    tone: 'success',
    traceStatus: null,
    icon: CheckIcon,
    needsUser: false,
    isCompleted: true,
    isFailed: false,
    isLoading: false,
    isWaiting: false,
    isNotStarted: false,
  },
  failed: {
    tone: 'destructive',
    traceStatus: 'error',
    icon: XIcon,
    needsUser: true,
    isCompleted: false,
    isFailed: true,
    isLoading: false,
    isWaiting: false,
    isNotStarted: false,
  },
} as const satisfies Record<WorkStatus, StatusLook & { traceStatus: 'running' | 'error' | null }>
