'use client'

import type { Interrupt } from '@/modules/review/entities'
import { answerLines, decisionOption } from '@/modules/review/entities'

import { activityChatMessages } from '../activity-chat.constants'

/** How an interrupt was answered: by the user, or by the defaults when nobody was asked. */
function answeredWords(interrupt: Interrupt): string {
  return interrupt.decision?.decided_by === null
    ? activityChatMessages.answeredWithDefault
    : activityChatMessages.answered
}

/** The answers to the questions that an agent asked, one line for each, as the interrupt held them. */
function AskedEntry({ interrupt }: { interrupt: Interrupt }) {
  const lines = answerLines(interrupt)
  return (
    <div className="flex min-w-0 flex-col gap-0.5 text-sm">
      <span className="font-semibold">{answeredWords(interrupt)}</span>
      {lines.map(({ prompt, text }) => (
        <span key={prompt} className="text-muted-foreground">
          {prompt} <span className="text-foreground">{text}</span>
        </span>
      ))}
    </div>
  )
}

/** A review of the run that no longer waits: one line of its answer, or its stop with the run. */
export function ReviewEntry({ interrupt }: { interrupt: Interrupt }) {
  const decided = decisionOption(interrupt)

  if (interrupt.status === 'cancelled') {
    return <p className="text-sm text-muted-foreground">{activityChatMessages.stopped}</p>
  }
  if (interrupt.purpose === 'ask') {
    return <AskedEntry interrupt={interrupt} />
  }

  return (
    <p className="flex min-w-0 flex-col gap-0.5 text-sm">
      <span className="font-semibold">
        {answeredWords(interrupt)} {decided?.label ?? activityChatMessages.stopped}
      </span>
      {interrupt.decision?.feedback != null && (
        <span className="text-muted-foreground">{interrupt.decision.feedback}</span>
      )}
    </p>
  )
}
