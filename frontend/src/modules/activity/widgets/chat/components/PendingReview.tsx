'use client'

import { cn } from 'cn'

import type { Interrupt } from '@/modules/review/entities'
import { useInterruptStatusLook } from '@/modules/review/entities'
import { AnswerReviewForm } from '@/modules/review/features/answer'
import type { Run } from '@/modules/run/entities'
import { useOpenPage } from '@/shared/components/frame'
import { Button } from '@/shared/components/ui/button'
import { toneClasses } from '@/shared/lib/tone'
import { routes } from '@/shared/routes'

import { activityChatMessages } from '../activity-chat.constants'

/**
 * The review that waits for the user, laid over the end of the chat instead of an entry among the
 * messages: what it asks and what it reviews stand in blocks of their own above the answer, and
 * the entry the chat keeps is the one line of the answer. The title announces itself once; the
 * changes of the run and of the card stay silent.
 */
export function PendingReview({
  interrupt,
  run,
  projectId,
}: {
  interrupt: Interrupt
  run: Run
  projectId: string
}) {
  const look = useInterruptStatusLook(interrupt.status)
  const openPage = useOpenPage()
  const Mark = look.icon

  return (
    <div className="flex flex-col divide-y rounded-xl border bg-card text-card-foreground shadow-lg">
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
              <Button
                key={ref.artifact_id}
                variant="link"
                size="xs"
                className="h-auto p-0"
                onClick={() => {
                  openPage(routes.project(projectId).document(ref.artifact_id))
                }}
              >
                {ref.title}{' '}
                <span className="text-muted-foreground">
                  {activityChatMessages.version(ref.version)}
                </span>
              </Button>
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
