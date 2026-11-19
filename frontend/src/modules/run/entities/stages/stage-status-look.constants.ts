import { CheckIcon, CircleAlertIcon, CircleStopIcon, CircleXIcon } from 'lucide-react'

import { Spinner } from '@/shared/components/ui/spinner'

import type { StatusLook } from '../steps/status-look.types'
import type { StageStatus } from './stage-progress.types'

/** How each status of a stage or of a subject shows, as Progress marks it. */
export const stageStatusLooks = {
  done: {
    tone: 'success',
    mood: 'happy',
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
    mood: 'working',
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
    mood: 'waiting',
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
    mood: 'worried',
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
    mood: 'sleepy',
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
    mood: 'idle',
    icon: null,
    needsUser: false,
    isCompleted: false,
    isFailed: false,
    isLoading: false,
    isWaiting: false,
    isNotStarted: true,
  },
} as const satisfies Record<StageStatus, StatusLook>
