import { CircleDashedIcon, type LucideIcon, XIcon } from 'lucide-react'

import type { Tone } from '@/shared/lib/tone'

import type { RunStatus } from '../run-status.types'

/** A status of a run, or none, and how it shows. */
export const lookCases: {
  name: string
  status: RunStatus | null
  look: { tone: Tone; icon: LucideIcon; needsUser: boolean }
}[] = [
  {
    name: 'a failed run, after which the user has to act',
    status: 'failed',
    look: { tone: 'destructive', icon: XIcon, needsUser: true },
  },
  {
    name: 'no run yet',
    status: null,
    look: { tone: 'muted', icon: CircleDashedIcon, needsUser: false },
  },
]
