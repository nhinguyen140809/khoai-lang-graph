'use client'

import { type KeyboardEvent, useState } from 'react'

import { ApiError } from '@/shared/api/api-fetch.utils'
import { Button } from '@/shared/components/ui/button'
import { Spinner } from '@/shared/components/ui/spinner'
import { Textarea } from '@/shared/components/ui/textarea'

import { useResumeRun } from '../hooks/useResumeRun'
import { useReviewedItems } from '../hooks/useReviewedItems'
import type { Answer, Interrupt } from '../review.types'
import {
  buildResumeBody,
  defaultOption,
  editedItems,
  initialAnswers,
  validateReview,
} from '../review-form.utils'
import { ChoiceList } from './ChoiceList'
import { QuestionField } from './QuestionField'

interface ReviewCardProps {
  interrupt: Interrupt
  /** Called when the run has the answer, and when the user leaves the review for later. */
  onDone: () => void
}

/**
 * What a run asks at a checkpoint: the options of the checkpoint as a numbered list, a box for
 * the feedback that an option asks for, and the questions. Enter sends the answer; Esc leaves the
 * review waiting.
 */
export function ReviewCard({ interrupt, onDone }: ReviewCardProps) {
  const resume = useResumeRun(interrupt.run_id)
  const [optionKey, setOptionKey] = useState(defaultOption(interrupt.options)?.key)
  const [feedback, setFeedback] = useState('')
  const [answers, setAnswers] = useState<Record<string, Answer>>(() =>
    initialAnswers(interrupt.questions),
  )
  const [problems, setProblems] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState<string | null>(null)

  const reviewed = useReviewedItems(
    interrupt.review_artifacts.map(({ artifact_id }) => artifact_id),
  )
  const edited = editedItems(reviewed.data ?? [])
  const option = interrupt.options.find(({ key }) => key === optionKey)

  const send = () => {
    setFailure(null)
    const found = validateReview(interrupt, { option, feedback, answers })
    setProblems(found)
    if (Object.keys(found).length > 0) return
    // The promise outlives this card: the answer makes the review disappear, which removes it.
    void resume
      .mutateAsync(buildResumeBody(interrupt, { option, feedback, answers, edited }))
      .then(onDone, (error: unknown) => {
        if (error instanceof ApiError && error.fieldErrors.length > 0) {
          setProblems(
            Object.fromEntries(error.fieldErrors.map(({ field, message }) => [field, message])),
          )
          return
        }
        setFailure(error instanceof Error ? error.message : 'The answer was not sent.')
      })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onDone()
      return
    }
    // Enter sends, except where it adds a line to a box.
    if (event.key === 'Enter' && !(event.target instanceof HTMLTextAreaElement)) {
      event.preventDefault()
      send()
    }
  }

  return (
    // The keys of the review work from any of its inputs, so they are heard on the whole card.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <section
      aria-label="Review"
      onKeyDown={handleKeyDown}
      className="my-2 flex flex-col gap-3 rounded-md border border-warning-strong/40 bg-warning/5 p-3 font-mono text-xs"
    >
      <header className="flex flex-col gap-1">
        <p className="font-medium text-warning-strong">? {interrupt.prompt}</p>
        {interrupt.review_artifacts.length > 0 && (
          <p className="text-muted-foreground">
            Under review:{' '}
            {interrupt.review_artifacts
              .map(({ title, version }) => `${title} v${String(version)}`)
              .join(', ')}
          </p>
        )}
        {edited.length > 0 && (
          <p className="text-muted-foreground">
            Edited by you:{' '}
            {edited.map(({ key, version }) => `${key} v${String(version)}`).join(', ')}
          </p>
        )}
      </header>

      {interrupt.options.length > 0 && (
        <div className="flex flex-col gap-1">
          <ChoiceList
            label="Options"
            choices={interrupt.options}
            value={optionKey === undefined ? [] : [optionKey]}
            onChange={([key]) => {
              setOptionKey(key)
              setProblems({})
            }}
          />
          {problems.option !== undefined && (
            <p role="alert" className="text-destructive-strong">
              {problems.option}
            </p>
          )}
        </div>
      )}

      {option?.requires_feedback === true && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`feedback-${interrupt.id}`} className="font-medium">
            Feedback (required)
          </label>
          <Textarea
            id={`feedback-${interrupt.id}`}
            rows={3}
            aria-invalid={problems.feedback !== undefined}
            value={feedback}
            onChange={(event) => {
              setFeedback(event.target.value)
            }}
          />
          {problems.feedback !== undefined && (
            <p role="alert" className="text-destructive-strong">
              {problems.feedback}
            </p>
          )}
        </div>
      )}

      {interrupt.questions.map((question) => (
        <QuestionField
          key={question.key}
          question={question}
          answer={answers[question.key] ?? question.default_answer}
          problem={problems[question.key]}
          onChange={(answer) => {
            setAnswers((previous) => ({ ...previous, [question.key]: answer }))
          }}
        />
      ))}

      {failure !== null && (
        <p role="alert" className="text-destructive-strong">
          {failure}
        </p>
      )}

      <footer className="flex items-center gap-3">
        <Button size="xs" disabled={resume.isPending} onClick={send}>
          {resume.isPending && <Spinner className="size-3" />}
          Send
        </Button>
        <Button size="xs" variant="ghost" onClick={onDone}>
          Later
        </Button>
        <span className="text-muted-foreground">enter send up/down choose esc later</span>
      </footer>
    </section>
  )
}
