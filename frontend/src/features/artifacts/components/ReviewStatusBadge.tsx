import { Badge } from '@/shared/ui/badge'

import type { Artifact } from '../artifacts.types'

const colors = {
  draft: 'neutral',
  approved: 'success',
  rejected: 'destructive',
  superseded: 'neutral',
} as const satisfies Record<Artifact['review_status'], string>

interface ReviewStatusBadgeProps {
  status: Artifact['review_status']
}

/** The review status of an artifact or of an item. */
export function ReviewStatusBadge({ status }: ReviewStatusBadgeProps) {
  return (
    <Badge variant={status === 'superseded' ? 'outline' : 'soft'} color={colors[status]}>
      {status}
    </Badge>
  )
}
