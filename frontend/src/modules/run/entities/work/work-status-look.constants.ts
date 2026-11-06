import { CheckIcon, CirclePauseIcon, CircleStopIcon, XIcon } from 'lucide-react'

import { Spinner } from '@/shared/components/ui/spinner'

import type { StatusLook } from '../steps/status-look.types'
import type { WorkStatus } from './work.types'

/** The mark of the trace of a line of work, or none. */
type TraceStatus = 'running' | 'error' | null

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
} as const satisfies Record<WorkStatus, StatusLook & { traceStatus: TraceStatus }>
