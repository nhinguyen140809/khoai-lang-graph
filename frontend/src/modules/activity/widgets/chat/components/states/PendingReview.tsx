'use client'

import { cn } from 'cn'
import { type Ref, useEffect, useRef } from 'react'

import { useReferenceOpener, useRevealReference } from '@/modules/activity/entities'
import type { Interrupt } from '@/modules/review/entities'
import { interruptActs, useInterruptStatusLook } from '@/modules/review/entities'
import { AnswerReviewForm } from '@/modules/review/features/answer'
import type { Run } from '@/modules/run/entities'
import { useRunLastWork } from '@/modules/run/entities'
import { Actor } from '@/shared/components/act'
import { Button } from '@/shared/components/ui/button'
import { fillSentence, listSentenceNodes } from '@/shared/lib/text'
import { toneClasses } from '@/shared/lib/tone'

import { activityChatMessages, pendingActSlots } from '../../activity-chat.constants'

/**
 * The review that waits for the user, laid over the end of the chat instead of an entry among the
 * messages: what it asks and what it reviews stand in blocks of their own above the answer, and
 * the entry the chat keeps is the one line of the answer. The title announces itself once; the
 * changes of the run and of the card stay silent. An outline in the secondary color sets it apart
 * as what waits for the user, and the agent that waits stands on its top corner, in the mood of
 * waiting with the act of the interrupt around it (a question, a page read), above and beside it only, so that it does not cover the card, where the sign of the interrupt would take room from the card; a card whose agent is not
 * known keeps that sign inside.
 */
export function PendingReview({
  interrupt,
  run,
  ref,
}: {
  interrupt: Interrupt
  run: Run
  /** The card, so that the chat can bring it into view and focus it. */
  ref?: Ref<HTMLDivElement>
}) {
  const agentRole = useRunLastWork(run)?.agentRole
  const hasAgent = agentRole !== undefined && agentRole !== ''

  // A review asks the user to look at a document, so the first one it names comes up beside the
  // chat: the page opens it when it shows nothing yet and asks first when it shows something else,
  // so a reader is never taken away from what they are reading. Each review does this once.
  const reveal = useRevealReference()
  const first = interrupt.review_artifacts[0]
  const shown = useRef<string | null>(null)
  useEffect(() => {
    if (first === undefined || shown.current === first.artifact_id) return
    shown.current = first.artifact_id
    reveal({ kind: 'document', artifactId: first.artifact_id }, first.title)
  }, [first, reveal])

  return (
    <div
      ref={ref}
      tabIndex={-1}
      data-purpose={interrupt.purpose}
      className={cn('group/pending relative pt-14 outline-none', toneClasses.secondary)}
    >
      {hasAgent && (
        <Actor
          seed={agentRole}
          size="2xl"
          mood="waiting"
          acts={interruptActs[interrupt.purpose]}
          slots={pendingActSlots[interrupt.purpose]}
          className="absolute -top-3 left-2 z-10 group-data-[purpose=review]/pending:left-10"
        />
      )}
      <ReviewCard interrupt={interrupt} run={run} hasSign={!hasAgent} />
    </div>
  )
}

function ReviewCard({
  interrupt,
  run,
  hasSign,
}: {
  interrupt: Interrupt
  run: Run
  /** Whether the sign of the interrupt shows inside the card, because no agent stands on its corner. */
  hasSign: boolean
}) {
  const look = useInterruptStatusLook(interrupt.status)
  const Mark = look.icon

  return (
    <div className="flex flex-col divide-y-2 divide-(--tone-border) rounded-xl border-2 border-(--tone-border) bg-card/70 text-card-foreground shadow-lg supports-backdrop-filter:backdrop-blur">
      <div className="flex flex-col gap-1.5 px-4 py-3">
        <div className="flex items-start gap-3">
          {/* The look of the interrupt decides the color of both its signs, whatever it is. */}
          {hasSign && (
            <Mark
              aria-hidden
              className={cn('mt-0.5 size-4 shrink-0 text-(--tone-strong)', toneClasses[look.tone])}
            />
          )}
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className={cn('text-sm font-medium text-(--tone-strong)', toneClasses[look.tone])}>
              {look.label}
            </p>
            <p role="status" className="text-sm leading-snug font-medium">
              {interrupt.prompt}
            </p>
          </div>
        </div>
        {/* What to look at reads as the context of the ask, in a sentence; an ask with no document shows none. */}
        {interrupt.review_artifacts.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {fillSentence(activityChatMessages.readBeforeAnswering, {
              documents: listSentenceNodes(
                interrupt.review_artifacts,
                (ref) => <ReviewDocumentLink document={ref} />,
                (ref) => ref.artifact_id,
              ),
            })}
          </p>
        )}
      </div>
      <div className="px-3 py-3">
        <AnswerReviewForm key={interrupt.id} interrupt={interrupt} run={run} />
      </div>
    </div>
  )
}

/** A document that the review asks to look at, which opens where the page of the chat says. */
function ReviewDocumentLink({ document }: { document: { artifact_id: string; title: string } }) {
  const open = useReferenceOpener({ kind: 'document', artifactId: document.artifact_id })
  return (
    // Inline with the words around it, at their size and on their baseline, so that the line does
    // not move when the name is underlined.
    <Button
      variant="link"
      className="inline h-auto p-0 align-baseline text-sm font-semibold whitespace-normal"
      disabled={open === null}
      onClick={open ?? undefined}
    >
      {document.title}
    </Button>
  )
}
