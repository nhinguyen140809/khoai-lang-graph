'use client'

import { type ComponentType, type ReactNode } from 'react'
import { type Control, useController } from 'react-hook-form'

import type { InterruptQuestion } from '@/modules/review/entities'
import type { QuestionAnswer } from '@/modules/workflow/entities'
import {
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireTitle,
} from '@/shared/components/ui/questionnaire'

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

/** The choices of a question, in one list; the input of the type decides what a click does. */
function Choices({
  question,
  chosen,
  onChoose,
}: {
  question: InterruptQuestion
  chosen: readonly string[]
  onChoose: (key: string) => void
}) {
  return (
    <QuestionnaireChoices className="gap-1">
      {question.choices.map((choice) => (
        <QuestionnaireChoice
          key={choice.key}
          value={choice.key}
          className="min-h-9 py-1.5"
          checked={chosen.includes(choice.key)}
          onChange={() => {
            onChoose(choice.key)
          }}
        >
          {choice.label}
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
      onChoose={(key) => {
        onChange({ ...answer, choice_keys: [key] })
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
      onChoose={(key) => {
        onChange({
          ...answer,
          choice_keys: chosen.includes(key)
            ? chosen.filter((chosenKey) => chosenKey !== key)
            : [...chosen, key],
        })
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
  const chosen = answer.choice_keys
  const hasTextChoice = question.choices.some(
    (choice) => choice.requires_text && chosen.includes(choice.key),
  )

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
      {hasTextChoice && (
        <QuestionnaireInput
          type="text"
          aria-label={`More about your choice for "${question.prompt}"`}
          value={answer.text ?? ''}
          onChange={(event) => {
            onChange({ ...answer, text: event.target.value })
          }}
        />
      )}
      <QuestionnaireError>{isInvalid ? error.message : null}</QuestionnaireError>
    </QuestionnaireItem>
  )
}
