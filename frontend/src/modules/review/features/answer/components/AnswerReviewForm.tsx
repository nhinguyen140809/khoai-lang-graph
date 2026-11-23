'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import type { Interrupt, InterruptOption } from '@/modules/review/entities'
import type { Run } from '@/modules/run/entities'
import { DirectionalSwap } from '@/shared/components/animation'
import { Button } from '@/shared/components/ui/button'
import { PendingButton } from '@/shared/components/ui/pending-button'
import { Questionnaire } from '@/shared/components/ui/questionnaire'

import { answerReviewMessages as words } from '../answer-review.constants'
import { useAnswerReviewForm } from '../hooks/useAnswerReviewForm'
import { useAnswerSteps } from '../hooks/useAnswerSteps'
import { type FeedbackBoxContextValue, FeedbackBoxProvider } from './FeedbackBoxContext'
import { OptionsColumn } from './options/OptionsColumn'
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
  const { form, selectOption, send, sendOnKey, isPending, keys } = useAnswerReviewForm(
    interrupt,
    run,
  )
  const questions = interrupt.questions
  const hasOptions = interrupt.options.length > 0
  const stepCount = questions.length + (hasOptions ? 1 : 0)
  const { step, direction, goTo, form: formRef, focusStep } = useAnswerSteps(stepCount, send)
  const isLast = step === stepCount - 1
  const question = questions.at(step)
  const stepNav = <StepNav step={step} stepCount={stepCount} onStep={goTo} />

  return (
    // Not a form of its own: each question is drawn in a form by the questionnaire, and a form
    // cannot hold a form. Enter and the button send the answer from here.
    <div ref={formRef} aria-keyshortcuts={keys} className="flex flex-col gap-2">
      {hasOptions && questions.length > 0 && (
        <p className="text-xs font-medium text-muted-foreground">{words.agentAsks}</p>
      )}
      {/* The step that is shown slides out before the next one slides in from the side it comes from: forward from the right, back from the left. */}
      <DirectionalSwap
        swapKey={step}
        direction={direction}
        mode="wait"
        distance={0.08}
        duration={250}
      >
        <div ref={focusStep} className="flex flex-col gap-2">
          {question !== undefined ? (
            <QuestionStep
              key={question.key}
              question={question}
              control={form.control}
              nav={stepNav}
            />
          ) : (
            <OptionsStep
              options={interrupt.options}
              chosen={form.watch('option')}
              feedback={form.watch('feedback')}
              nav={stepCount > 1 ? stepNav : null}
              onSelect={selectOption}
              onFeedback={(text) => {
                form.setValue('feedback', text)
              }}
              onFeedbackKey={sendOnKey}
            />
          )}
        </div>
      </DirectionalSwap>
      {form.formState.errors.feedback != null && (
        <p className="text-xs text-destructive">{form.formState.errors.feedback.message}</p>
      )}
      {isLast && (
        <div className="flex justify-end">
          <PendingButton
            type="button"
            pendingLabel={words.sending}
            pending={isPending}
            onClick={() => {
              void send()
            }}
          >
            {hasOptions ? words.send : words.sendAnswers}
          </PendingButton>
        </div>
      )}
    </div>
  )
}

/** A question of the answer on its step, with the steps to move on beside it. */
function QuestionStep({
  question,
  control,
  nav,
}: {
  question: Interrupt['questions'][number]
  control: ComponentProps<typeof QuestionField>['control']
  nav: ReactNode
}) {
  return (
    <Questionnaire>
      <QuestionField question={question} control={control} actions={nav} />
    </Questionnaire>
  )
}

/** The last step of the answer: its options in a column, with the box of feedback inside the one that is chosen. */
function OptionsStep({
  options,
  chosen,
  feedback,
  nav,
  onSelect,
  onFeedback,
  onFeedbackKey,
}: {
  options: readonly InterruptOption[]
  chosen: string | null
  feedback: string
  /** The steps to move on; left out when the options are the only step. */
  nav: ReactNode
  onSelect: (option: InterruptOption) => void
  onFeedback: (text: string) => void
  onFeedbackKey: FeedbackBoxContextValue['onFeedbackKey']
}) {
  return (
    <>
      {nav !== null && <div className="flex justify-end">{nav}</div>}
      <FeedbackBoxProvider value={{ feedback, onFeedback, onFeedbackKey }}>
        <OptionsColumn options={options} chosen={chosen} onSelect={onSelect} />
      </FeedbackBoxProvider>
    </>
  )
}

/** The steps of the answer: one back, the count, one forward. */
function StepNav({
  step,
  stepCount,
  onStep,
}: {
  step: number
  stepCount: number
  onStep: (step: number) => void
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
          onStep(step - 1)
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
          onStep(step + 1)
        }}
      >
        <ChevronRightIcon aria-hidden />
      </Button>
    </div>
  )
}
