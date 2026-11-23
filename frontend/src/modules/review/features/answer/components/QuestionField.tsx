'use client'

import { type ComponentType, type ReactNode, useRef } from 'react'
import { type Control, useController } from 'react-hook-form'

import type { InterruptQuestion } from '@/modules/review/entities'
import type { QuestionAnswer } from '@/modules/workflow/entities'
import {
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireTitle,
} from '@/shared/components/ui/questionnaire'
import { useFocusWhen } from '@/shared/lib/viewport'

import { answerReviewMessages as words } from '../answer-review.constants'
import type { AnswerReviewFormValues } from '../answer-review.types'

interface QuestionFieldProps {
  question: InterruptQuestion
  /** The control of the answer form, whose `answers` hold the answer to the question. */
  control: Control<AnswerReviewFormValues, unknown, AnswerReviewFormValues>
  /** What sits at the right end of the row of the title, such as the steps of the pager. */
  actions?: ReactNode
}

interface QuestionInputProps {
  question: InterruptQuestion
  answer: QuestionAnswer
  onChange: (answer: QuestionAnswer) => void
}

/**
 * The text that a choice such as "Other" asks for, inside the box of the choice and above the
 * overlay that takes the click of the box, and taking the focus as it shows.
 */
function ChoiceText({
  label,
  text,
  onText,
}: {
  label: string
  text: string
  onText: (text: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  useFocusWhen(input, true)
  return (
    <div className="relative z-20 pt-1 pb-0.5">
      <QuestionnaireInput
        ref={input}
        type="text"
        aria-label={label}
        value={text}
        onChange={(event) => {
          onText(event.target.value)
        }}
      />
    </div>
  )
}

/** The choices of a question, in one list; the input of the type decides what a click does. */
function Choices({
  question,
  chosen,
  text,
  onChoose,
  onText,
}: {
  question: InterruptQuestion
  chosen: readonly string[]
  text: string
  onChoose: (key: string) => void
  onText: (text: string) => void
}) {
  return (
    <QuestionnaireChoices className="gap-1">
      {question.choices.map((choice) => (
        <QuestionnaireChoice
          key={choice.key}
          value={choice.key}
          // The focus shows as a ring whatever took it, as the options of the review do.
          className="min-h-9 py-1.5 has-[>input:focus]:border-ring has-[>input:focus]:ring-3 has-[>input:focus]:ring-ring/50"
          checked={chosen.includes(choice.key)}
          onChange={() => {
            onChoose(choice.key)
          }}
        >
          <span>
            {choice.label}
            {/* The default answer is the one that the agent would act on, so it says so. */}
            {question.default_answer?.choice_keys.includes(choice.key) === true && (
              <span className="ml-1.5 font-normal text-muted-foreground">{words.recommended}</span>
            )}
          </span>
          {choice.description !== undefined && (
            <QuestionnaireChoiceDescription className="text-wrap">
              {choice.description}
            </QuestionnaireChoiceDescription>
          )}
          {choice.requires_text && chosen.includes(choice.key) && (
            <ChoiceText
              label={`${words.moreAbout} "${question.prompt}"`}
              text={text}
              onText={onText}
            />
          )}
        </QuestionnaireChoice>
      ))}
    </QuestionnaireChoices>
  )
}

/** One choice of a single-select question. */
function SingleSelectInput({ question, answer, onChange }: QuestionInputProps) {
  return (
    <Choices
      question={question}
      chosen={answer.choice_keys}
      text={answer.text ?? ''}
      onChoose={(key) => {
        onChange({ ...answer, choice_keys: [key] })
      }}
      onText={(text) => {
        onChange({ ...answer, text })
      }}
    />
  )
}

/** The choices of a multi-select question: a click adds or drops one. */
function MultiSelectInput({ question, answer, onChange }: QuestionInputProps) {
  const chosen = answer.choice_keys
  return (
    <Choices
      question={question}
      chosen={chosen}
      text={answer.text ?? ''}
      onChoose={(key) => {
        onChange({
          ...answer,
          choice_keys: chosen.includes(key)
            ? chosen.filter((chosenKey) => chosenKey !== key)
            : [...chosen, key],
        })
      }}
      onText={(text) => {
        onChange({ ...answer, text })
      }}
    />
  )
}

/** A free text answer. */
function FreeTextInput({ question, answer, onChange }: QuestionInputProps) {
  return (
    <QuestionnaireInput
      type="text"
      aria-label={question.prompt}
      value={answer.text ?? ''}
      onChange={(event) => {
        onChange({ ...answer, text: event.target.value })
      }}
    />
  )
}

/** A number answer. */
function NumberInput({ question, answer, onChange }: QuestionInputProps) {
  return (
    <QuestionnaireInput
      type="number"
      aria-label={question.prompt}
      value={answer.number ?? ''}
      onChange={(event) => {
        const text = event.target.value
        onChange({ ...answer, number: text === '' ? null : Number(text) })
      }}
    />
  )
}

/** The input of each type of question, and whether it picks several choices. */
const questionInputs = {
  single_select: { Input: SingleSelectInput, isMultiple: false },
  multi_select: { Input: MultiSelectInput, isMultiple: true },
  free_text: { Input: FreeTextInput, isMultiple: false },
  number: { Input: NumberInput, isMultiple: false },
} as const satisfies Record<
  InterruptQuestion['type'],
  { Input: ComponentType<QuestionInputProps>; isMultiple: boolean }
>

/** One question of a review, drawn by its type: choices, a text, or a number. */
export function QuestionField({ question, control, actions }: QuestionFieldProps) {
  const {
    field: { value: answer, onChange },
    fieldState: { error },
  } = useController({ control, name: `answers.${question.key}` })
  const isInvalid = error !== undefined
  const { Input, isMultiple } = questionInputs[question.type]

  return (
    <QuestionnaireItem
      name={question.key}
      multiple={isMultiple}
      invalid={isInvalid}
      required={question.required}
      className="gap-4"
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3">
        <QuestionnaireTitle className="min-w-0 flex-1 [&:not(:has(~[data-slot=questionnaire-description]))]:mb-0">
          {question.prompt}
          {question.required && <span aria-hidden> *</span>}
        </QuestionnaireTitle>
        {actions}
      </div>
      <Input question={question} answer={answer} onChange={onChange} />
      <QuestionnaireError>{isInvalid ? error.message : null}</QuestionnaireError>
    </QuestionnaireItem>
  )
}
