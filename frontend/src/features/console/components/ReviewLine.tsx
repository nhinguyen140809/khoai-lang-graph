'use client'

import Link from 'next/link'

import { routes } from '@/shared/config/routes'

import { isFollowingLog } from '../event-scroll.utils'
import { usePendingReview } from '../hooks/usePendingReview'
import { EventRow, StatusDot } from './EventRow'

interface ReviewLineProps {
  projectId: string
  runId: string
}

/** The review that a paused run waits for: which artifact is under review and what is asked. */
export function ReviewLine({ projectId, runId }: ReviewLineProps) {
  const review = usePendingReview(runId)

  if (review.isPending) {
    return (
      <EventRow mark={<StatusDot />}>
        <span className="text-muted-foreground">Loading the review...</span>
      </EventRow>
    )
  }
  if (review.isError || review.data === null) {
    return <EventRow mark={<StatusDot tone="warning" />}>Waiting for your review</EventRow>
  }

  const artifact = review.data.review_artifacts[0]
  return (
    <div
      ref={(element) => {
        // The review is the newest row: keep it in view while the log follows its newest row.
        if (isFollowingLog()) element?.scrollIntoView({ block: 'end' })
      }}
    >
      <EventRow mark={<StatusDot tone="warning" />}>
        {artifact === undefined
          ? 'Waiting for your review'
          : `${artifact.title} v${String(artifact.version)} waits for your review`}
      </EventRow>
      <EventRow>
        <span className="text-muted-foreground">{review.data.prompt}</span>
      </EventRow>
      <EventRow>
        <Link
          href={routes.project(projectId).review(runId)}
          className="rounded-sm text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Open the review
        </Link>
      </EventRow>
    </div>
  )
}
