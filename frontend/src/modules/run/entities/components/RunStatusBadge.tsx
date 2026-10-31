'use client'

import { Badge } from '@/shared/components/ui/badge'

import { useRunStatusLook } from '../status/hooks/useRunStatusLook'
import type { RunStatus } from '../status/run-status.types'

interface RunStatusBadgeProps {
  /** The status of a run, or null for a project or a thread without a run. */
  status: RunStatus | null
}

/** A badge in the color of a run status, with its icon and its label in the view of the app. */
export function RunStatusBadge({ status }: RunStatusBadgeProps) {
  const { tone, icon: Icon, label } = useRunStatusLook(status)

  return (
    <Badge variant="soft" color={tone}>
      <Icon aria-hidden />
      {label}
    </Badge>
  )
}
