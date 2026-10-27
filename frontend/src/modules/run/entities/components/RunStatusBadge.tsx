'use client'

import { Badge } from '@/shared/components/ui/badge'
import { useView } from '@/shared/lib/view'

import type { RunStatus } from '../types/run-status.types'
import { runStatusLabel } from '../utils/run-status.utils'
import { runStatusLook } from '../utils/run-status-look.utils'

interface RunStatusBadgeProps {
  /** The status of a run, or null for a project or a thread without a run. */
  status: RunStatus | null
}

/** A badge in the color of a run status, with its icon and its label in the view of the app. */
export function RunStatusBadge({ status }: RunStatusBadgeProps) {
  const view = useView()
  const { tone, icon: Icon } = runStatusLook(status)

  return (
    <Badge variant="soft" color={tone}>
      <Icon aria-hidden />
      {runStatusLabel(status)[view]}
    </Badge>
  )
}
