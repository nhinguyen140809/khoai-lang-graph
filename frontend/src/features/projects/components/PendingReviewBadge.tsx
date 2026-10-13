'use client'

import { Badge } from '@/shared/components/ui/badge'

import { useProject } from '../hooks/useProject'

interface PendingReviewBadgeProps {
  projectId: string
}

/** The number of runs of the project that wait for a review; nothing when none waits. */
export function PendingReviewBadge({ projectId }: PendingReviewBadgeProps) {
  const project = useProject(projectId)
  const count = project.data?.unfinished_run_counts.interrupted ?? 0

  if (count === 0) return null

  return (
    <>
      <Badge aria-hidden color="warning" className="h-4 min-w-4 px-1 text-4xs">
        {count}
      </Badge>
      <span className="sr-only">
        , {count} {count === 1 ? 'review' : 'reviews'} waiting
      </span>
    </>
  )
}
