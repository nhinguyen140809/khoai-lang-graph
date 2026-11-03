import type { Tone } from '@/shared/lib/tone'
import type { View } from '@/shared/lib/view'

import type { RunStatus } from '../../run-status.types'

/** A run status, or none, a view of the app, and the look with the label that it gives there. */
export const statusLookCases: {
  name: string
  status: RunStatus | null
  view: View
  label: string
  tone: Tone
  needsUser: boolean
}[] = [
  {
    name: 'a review that waits',
    status: 'interrupted',
    view: 'user',
    label: 'Waiting for you',
    tone: 'warning',
    needsUser: true,
  },
  {
    name: 'a review that waits',
    status: 'interrupted',
    view: 'developer',
    label: 'Waiting for review',
    tone: 'warning',
    needsUser: true,
  },
  {
    name: 'a run that failed',
    status: 'failed',
    view: 'user',
    label: 'Failed',
    tone: 'destructive',
    needsUser: true,
  },
  {
    name: 'a run that works',
    status: 'running',
    view: 'developer',
    label: 'Running',
    tone: 'primary',
    needsUser: false,
  },
  {
    name: 'no run',
    status: null,
    view: 'user',
    label: 'Not started',
    tone: 'neutral',
    needsUser: false,
  },
  {
    name: 'no run',
    status: null,
    view: 'developer',
    label: 'No run yet',
    tone: 'neutral',
    needsUser: false,
  },
]
