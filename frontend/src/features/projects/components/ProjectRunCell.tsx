import { Badge } from '@/components/ui/badge'
import { runStatusLabels, runStatusTones } from '@/lib/run-status.constants'

import { mostUrgentRunStatus } from '../project-list.utils'
import type { UnfinishedRunCounts } from '../projects.types'

interface ProjectRunCellProps {
  counts: UnfinishedRunCounts
}

/** The unfinished runs of a project that need the user most: those waiting for review first. */
export function ProjectRunCell({ counts }: ProjectRunCellProps) {
  const urgent = mostUrgentRunStatus(counts)

  if (urgent === undefined) {
    return (
      <span className="text-muted-foreground">
        <span aria-hidden>-</span>
        <span className="sr-only">No unfinished run</span>
      </span>
    )
  }

  const label = runStatusLabels[urgent.status]
  return (
    <Badge variant="soft" color={runStatusTones[urgent.status]}>
      {urgent.count > 1
        ? `${String(urgent.count)} ${label}`
        : label.charAt(0).toUpperCase() + label.slice(1)}
    </Badge>
  )
}
