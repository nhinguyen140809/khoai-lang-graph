'use client'

import { cn } from 'cn'

import { useReferenceOpener } from '@/modules/activity/entities'
import type { Interrupt } from '@/modules/review/entities'
import { useInterruptStatusLook } from '@/modules/review/entities'
import { AnswerReviewForm } from '@/modules/review/features/answer'
import type { Run } from '@/modules/run/entities'
import { Glow } from '@/shared/components/animation'
import { Button } from '@/shared/components/ui/button'
import { toneClasses } from '@/shared/lib/tone'

import { activityChatMessages } from '../activity-chat.constants'

/**
 * The review that waits for the user, laid over the end of the chat instead of an entry among the
 * messages: what it asks and what it reviews stand in blocks of their own above the answer, and
 * the entry the chat keeps is the one line of the answer. The title announces itself once; the
 * changes of the run and of the card stay silent. A soft glow in the secondary color behind it and
 * an outline of the same color set it apart as what waits for the user.
 */
export function PendingReview({ interrupt, run }: { interrupt: Interrupt; run: Run }) {
  return (
    <div className={cn('relative isolate', toneClasses.secondary)}>
      <Glow
        color="secondary"
        strength={28}
        shape="ellipse"
        width="100%"
        height="100%"
        entrance="grow"
        className="absolute inset-x-0 -inset-y-3 -z-10"
      />
      <ReviewCard interrupt={interrupt} run={run} />
    </div>
  )
}

function ReviewCard({ interrupt, run }: { interrupt: Interrupt; run: Run }) {
  const look = useInterruptStatusLook(interrupt.status)
  const Mark = look.icon

  return (
    <div className="flex flex-col divide-y-2 divide-(--tone-border) rounded-xl border-2 border-(--tone-border) bg-card/70 text-card-foreground shadow-lg supports-backdrop-filter:backdrop-blur">
      <div className="flex flex-col gap-1.5 px-4 py-3">
        <div className="flex items-start gap-3">
          {/* The look of the interrupt decides the color of both its signs, whatever it is. */}
          <Mark
            aria-hidden
            className={cn('mt-0.5 size-4 shrink-0 text-(--tone-strong)', toneClasses[look.tone])}
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className={cn('text-xs font-medium text-(--tone-strong)', toneClasses[look.tone])}>
              {look.label}
            </p>
            <p role="status" className="text-sm leading-snug font-medium">
              {interrupt.prompt}
            </p>
          </div>
        </div>
        {/* What to look at reads as the context of the ask; an ask with no document shows none. */}
        {interrupt.review_artifacts.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-7 text-sm">
            <span className="text-muted-foreground">{activityChatMessages.toReview}</span>
            {interrupt.review_artifacts.map((ref) => (
              <ReviewDocumentLink key={ref.artifact_id} document={ref} />
            ))}
          </div>
        )}
      </div>
      <div className="px-3 py-3">
        <AnswerReviewForm key={interrupt.id} interrupt={interrupt} run={run} />
      </div>
    </div>
  )
}

/** A document that the review asks to look at, which opens where the page of the chat says. */
function ReviewDocumentLink({
  document,
}: {
  document: { artifact_id: string; title: string; version: number }
}) {
  const open = useReferenceOpener({ kind: 'document', artifactId: document.artifact_id })
  return (
    <Button
      variant="link"
      size="xs"
      className="h-auto p-0"
      disabled={open === null}
      onClick={open ?? undefined}
    >
      {document.title}{' '}
      <span className="text-muted-foreground">
        {activityChatMessages.version(document.version)}
      </span>
    </Button>
  )
}
