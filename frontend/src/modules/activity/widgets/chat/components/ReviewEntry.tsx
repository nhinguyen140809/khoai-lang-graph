'use client'

import { CornerDownRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Interrupt } from '@/modules/review/entities'
import { answerLines, decisionOption } from '@/modules/review/entities'

import { activityChatMessages } from '../activity-chat.constants'

/** How an interrupt was answered: by the user, or by the defaults when nobody was asked. */
function answeredWords(interrupt: Interrupt): string {
  return interrupt.decision?.decided_by === null
    ? activityChatMessages.answeredWithDefault
    : activityChatMessages.answered
}

/** The line of an answer under what it answers: an arrow that hooks down to it, then its words. */
function AnswerLine({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-start gap-2">
      <CornerDownRightIcon aria-hidden className="mt-1 size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 text-foreground">{children}</span>
    </span>
  )
}

/** The answers to the questions that an agent asked: each question, and its answer under it. */
function AskedEntry({ interrupt }: { interrupt: Interrupt }) {
  const lines = answerLines(interrupt)
  return (
    <div className="flex min-w-0 flex-col gap-3 text-sm leading-6">
      <span className="font-semibold text-primary">{answeredWords(interrupt)}</span>
      {lines.map(({ prompt, text }) => (
        <div key={prompt} className="flex min-w-0 flex-col">
          <span className="text-muted-foreground">{prompt}</span>
          <AnswerLine>{text}</AnswerLine>
        </div>
      ))}
    </div>
  )
}

/** A review of the run that no longer waits: its answer, or its stop with the run. */
export function ReviewEntry({ interrupt }: { interrupt: Interrupt }) {
  if (interrupt.status === 'cancelled') {
    return <p className="text-sm text-muted-foreground">{activityChatMessages.stopped}</p>
  }
  if (interrupt.purpose === 'ask') {
    return <AskedEntry interrupt={interrupt} />
  }

  const decided = decisionOption(interrupt)
  return (
    <div className="flex min-w-0 flex-col gap-1 text-sm leading-6">
      <p>
        <span className="font-semibold text-primary">{answeredWords(interrupt)}</span>{' '}
        <span className="font-semibold">{decided?.label ?? activityChatMessages.stopped}</span>
      </p>
      {interrupt.decision?.feedback != null && (
        <AnswerLine>
          <span className="text-muted-foreground">{interrupt.decision.feedback}</span>
        </AnswerLine>
      )}
    </div>
  )
}
