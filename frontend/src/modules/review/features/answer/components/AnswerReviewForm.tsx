'use client'

import { cn } from 'cn'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { Interrupt, InterruptOption } from '@/modules/review/entities'
import type { Run } from '@/modules/run/entities'
import { Button } from '@/shared/components/ui/button'
import { PendingButton } from '@/shared/components/ui/pending-button'
import { Questionnaire } from '@/shared/components/ui/questionnaire'
import { Textarea } from '@/shared/components/ui/textarea'

import type { answerReviewMessages } from '../answer-review.constants'
import { useAnswerReviewForm } from '../hooks/useAnswerReviewForm'
import { QuestionField } from './QuestionField'

interface AnswerReviewFormProps {
  interrupt: Interrupt
  run: Run
}

/**
 * The answer to a review, one thing at a time: each of its questions on a step of its own, then
 * its options in a column. An option that needs feedback carries its box inside it, ready to
 * write in as soon as it is chosen, and one send finishes the whole answer.
 */
export function AnswerReviewForm({ interrupt, run }: AnswerReviewFormProps) {
  const { form, selectOption, send, sendOnKey, isPending, keys, words } = useAnswerReviewForm(
    interrupt,
    run,
  )
  const [step, setStep] = useState(0)
  const questions = interrupt.questions
  const hasOptions = interrupt.options.length > 0
  const stepCount = questions.length + (hasOptions ? 1 : 0)
  const isLast = step === stepCount - 1
  const question = questions.at(step)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void send()
      }}
      aria-keyshortcuts={keys}
      className="flex flex-col gap-2"
    >
      {hasOptions && questions.length > 0 && (
        <p className="text-xs font-medium text-muted-foreground">{words.agentAsks}</p>
      )}
      {question !== undefined ? (
        <Questionnaire key={question.key}>
          <QuestionField
            question={question}
            control={form.control}
            actions={<StepNav step={step} stepCount={stepCount} words={words} onStep={setStep} />}
          />
        </Questionnaire>
      ) : (
        <>
          {stepCount > 1 && (
            <div className="flex justify-end">
              <StepNav step={step} stepCount={stepCount} words={words} onStep={setStep} />
            </div>
          )}
          <OptionsColumn
            options={interrupt.options}
            chosen={form.watch('option')}
            feedback={form.watch('feedback')}
            onSelect={selectOption}
            onFeedback={(text) => {
              form.setValue('feedback', text)
            }}
            onFeedbackKey={sendOnKey}
            words={words}
          />
        </>
      )}
      {form.formState.errors.feedback != null && (
        <p className="text-xs text-destructive">{form.formState.errors.feedback.message}</p>
      )}
      {isLast && (
        <div className="flex justify-end">
          <PendingButton type="submit" pendingLabel={words.sending} pending={isPending}>
            {hasOptions ? words.send : words.sendAnswers}
          </PendingButton>
        </div>
      )}
    </form>
  )
}

/** The steps of the answer: one back, the count, one forward. */
function StepNav({
  step,
  stepCount,
  words,
  onStep,
}: {
  step: number
  stepCount: number
  words: typeof answerReviewMessages
  onStep: (setter: (current: number) => number) => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={words.previous}
        disabled={step === 0}
        onClick={() => {
          onStep((current) => current - 1)
        }}
      >
        <ChevronLeftIcon aria-hidden />
      </Button>
      <p className="text-xs text-muted-foreground">{words.step(step + 1, stepCount)}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={words.next}
        disabled={step === stepCount - 1}
        onClick={() => {
          onStep((current) => current + 1)
        }}
      >
        <ChevronRightIcon aria-hidden />
      </Button>
    </div>
  )
}

/** How an option of the answer shows, by whether the user chose it. */
const optionLooks = {
  idle: 'border-border hover:bg-muted/40',
  chosen: 'border-primary',
} as const satisfies Record<'idle' | 'chosen', string>

/** How the dot of an option of the answer shows, by the same state. */
const optionDotLooks = {
  idle: 'border-muted-foreground/40',
  chosen: 'border-primary bg-primary',
} as const satisfies Record<'idle' | 'chosen', string>

/** The options of the answer in one column: the one that is chosen opens its box inside it. */
function OptionsColumn({
  options,
  chosen,
  feedback,
  onSelect,
  onFeedback,
  onFeedbackKey,
  words,
}: {
  options: readonly InterruptOption[]
  chosen: string | null
  feedback: string
  onSelect: (option: InterruptOption) => void
  onFeedback: (text: string) => void
  onFeedbackKey: (event: React.KeyboardEvent) => void
  words: typeof answerReviewMessages
}) {
  return (
    <div role="radiogroup" aria-label={words.choice} className="flex flex-col gap-1">
      {options.map((option) => (
        <OptionRow
          key={option.key}
          option={option}
          isChosen={chosen === option.key}
          feedback={feedback}
          onSelect={onSelect}
          onFeedback={onFeedback}
          onFeedbackKey={onFeedbackKey}
          words={words}
        />
      ))}
    </div>
  )
}

/** One option of the answer: while it is not chosen, a line says what choosing it asks for. */
function OptionRow({
  option,
  isChosen,
  feedback,
  onSelect,
  onFeedback,
  onFeedbackKey,
  words,
}: {
  option: InterruptOption
  isChosen: boolean
  feedback: string
  onSelect: (option: InterruptOption) => void
  onFeedback: (text: string) => void
  onFeedbackKey: (event: React.KeyboardEvent) => void
  words: typeof answerReviewMessages
}) {
  const state = isChosen ? 'chosen' : 'idle'
  const box = useRef<HTMLTextAreaElement | null>(null)

  // Choosing the option that asks for words puts the writer straight into them.
  useEffect(() => {
    if (isChosen) box.current?.focus()
  }, [isChosen])

  return (
    <div className={cn('rounded-lg border', optionLooks[state])}>
      <button
        type="button"
        role="radio"
        aria-checked={isChosen}
        className={cn(
          'flex w-full items-center gap-2 p-2 text-left',
          option.requires_feedback && 'pb-1',
        )}
        onClick={() => {
          onSelect(option)
        }}
      >
        <span
          aria-hidden
          className={cn('size-3.5 shrink-0 rounded-full border-2', optionDotLooks[state])}
        />
        <span className="text-xs font-medium">{option.label}</span>
      </button>
      {option.requires_feedback &&
        (isChosen ? (
          <div className="px-2 pb-2">
            <Textarea
              ref={box}
              rows={2}
              aria-label={words.feedbackFor(option.label)}
              placeholder={words.feedbackPlaceholder}
              value={feedback}
              onChange={(event) => {
                onFeedback(event.target.value)
              }}
              onKeyDown={onFeedbackKey}
              className="min-h-0 px-2 py-1 text-xs focus-visible:ring-0 md:text-xs"
            />
          </div>
        ) : (
          <p className="pb-2 pl-8 text-xs text-muted-foreground">{words.asksForDescription}</p>
        ))}
    </div>
  )
}
