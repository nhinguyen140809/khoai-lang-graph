'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type KeyboardEvent, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { Button } from '@/shared/components/ui/button'
import { Spinner } from '@/shared/components/ui/spinner'
import { Textarea } from '@/shared/components/ui/textarea'

import { useResumeRun } from '../hooks/useResumeRun'
import { useReviewedItems } from '../hooks/useReviewedItems'
import { reviewFormSchema } from '../review.schema'
import type { Interrupt } from '../review.types'
import { defaultOption, editedItems, initialAnswers } from '../review-form.utils'
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
  const reviewed = useReviewedItems(
    interrupt.review_artifacts.map(({ artifact_id }) => artifact_id),
  )
  const edited = useMemo(() => editedItems(reviewed.data ?? []), [reviewed.data])
  const schema = useMemo(() => reviewFormSchema(interrupt, edited), [interrupt, edited])
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      option: defaultOption(interrupt.options)?.key ?? null,
      feedback: '',
      answers: initialAnswers(interrupt.questions),
    },
  })
  const resume = useResumeRun(interrupt.run_id, {
    setError: form.setError,
    schema,
    onAnswered: onDone,
  })
  const optionKey = useWatch({ control: form.control, name: 'option' })
  const option = interrupt.options.find(({ key }) => key === optionKey)

  const send = form.handleSubmit((body) => {
    resume.mutate(body)
  })

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onDone()
      return
    }
    // Enter sends, except where it adds a line to a box.
    if (event.key === 'Enter' && !(event.target instanceof HTMLTextAreaElement)) {
      event.preventDefault()
      void send()
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
        <Controller
          control={form.control}
          name="option"
          render={({ field, fieldState: { error } }) => (
            <div className="flex flex-col gap-1">
              <ChoiceList
                label="Options"
                choices={interrupt.options}
                value={field.value === null ? [] : [field.value]}
                onChange={([key]) => {
                  field.onChange(key ?? null)
                  form.clearErrors()
                }}
              />
              {error !== undefined && (
                <p role="alert" className="text-destructive-strong">
                  {error.message}
                </p>
              )}
            </div>
          )}
        />
      )}

      {option?.requires_feedback === true && (
        <Controller
          control={form.control}
          name="feedback"
          render={({ field, fieldState: { error } }) => (
            <div className="flex flex-col gap-1">
              <label htmlFor={`feedback-${interrupt.id}`} className="font-medium">
                Feedback (required)
              </label>
              <Textarea
                id={`feedback-${interrupt.id}`}
                rows={3}
                aria-invalid={error !== undefined}
                {...field}
              />
              {error !== undefined && (
                <p role="alert" className="text-destructive-strong">
                  {error.message}
                </p>
              )}
            </div>
          )}
        />
      )}

      {interrupt.questions.map((question) => (
        <QuestionField key={question.key} question={question} control={form.control} />
      ))}

      {resume.formError !== null && (
        <p role="alert" className="text-destructive-strong">
          {resume.formError}
        </p>
      )}

      <footer className="flex items-center gap-3">
        <Button
          size="xs"
          disabled={resume.isPending}
          onClick={() => {
            void send()
          }}
        >
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
