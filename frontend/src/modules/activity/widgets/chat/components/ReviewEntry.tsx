'use client'

import type { Interrupt } from '@/modules/review/entities'
import { decisionOption } from '@/modules/review/entities'

import { activityChatMessages } from '../activity-chat.constants'

/** A review of the run that no longer waits: one line of its answer, or its stop with the run. */
export function ReviewEntry({ interrupt }: { interrupt: Interrupt }) {
  const decided = decisionOption(interrupt)

  if (interrupt.status === 'cancelled') {
    return <p className="text-sm text-muted-foreground">{activityChatMessages.stopped}</p>
  }

  return (
    <p className="flex min-w-0 flex-col gap-0.5 text-sm">
      <span className="font-semibold">
        {interrupt.decision?.decided_by === null
          ? activityChatMessages.answeredWithDefault
          : activityChatMessages.answered}{' '}
        {decided?.label ?? activityChatMessages.stopped}
      </span>
      {interrupt.decision?.feedback != null && (
        <span className="text-muted-foreground">{interrupt.decision.feedback}</span>
      )}
    </p>
  )
}
