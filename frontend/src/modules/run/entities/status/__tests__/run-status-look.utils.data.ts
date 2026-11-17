import { CircleDashedIcon, type LucideIcon, XIcon } from 'lucide-react'

import { DotIcon, ExclamationIcon, SpinningIcon } from '@/shared/components/ui/basic-icons'
import type { Tone } from '@/shared/lib/tone'
import type { View } from '@/shared/lib/view'

import type { RunStatus } from '../run-status.types'

/** A status of a run, or none, and how it shows. */
export const lookCases: {
  name: string
  status: RunStatus | null
  view: View
  look: { tone: Tone; icon: LucideIcon; needsUser: boolean }
}[] = [
  {
    name: 'a failed run, after which the user has to act, in the developer view',
    status: 'failed',
    view: 'developer',
    look: { tone: 'destructive', icon: XIcon, needsUser: true },
  },
  {
    name: 'a failed run in the user view, as an alert',
    status: 'failed',
    view: 'user',
    look: { tone: 'destructive', icon: ExclamationIcon, needsUser: true },
  },
  {
    name: 'a review that waits in the user view, as a dot',
    status: 'interrupted',
    view: 'user',
    look: { tone: 'warning', icon: DotIcon, needsUser: true },
  },
  {
    name: 'a run that works in the user view, as a spinner',
    status: 'running',
    view: 'user',
    look: { tone: 'primary', icon: SpinningIcon, needsUser: false },
  },
  {
    name: 'no run yet',
    status: null,
    view: 'user',
    look: { tone: 'muted', icon: CircleDashedIcon, needsUser: false },
  },
]
