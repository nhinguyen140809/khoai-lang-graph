'use client'

import { type Control, useController } from 'react-hook-form'

import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'

import type { ReviewForm } from '../review.schema'
import type { Question, ResumeBody } from '../review.types'
import { ChoiceList } from './ChoiceList'

interface QuestionFieldProps {
  question: Question
  /** The control of the review form, whose `answers` hold the answer to the question. */
  control: Control<ReviewForm, unknown, ResumeBody>
}

/** One question of a review, drawn by its type, with the answer filled in. */
export function QuestionField({ question, control }: QuestionFieldProps) {
  const {
    field: { value: answer, onChange },
    fieldState: { error },
  } = useController({ control, name: `answers.${question.key}` })
  const id = `question-${question.key}`
  const invalid = error !== undefined
  const needsText = question.choices.some(
    (choice) => choice.requires_text && answer.choice_keys.includes(choice.key),
  )

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-xs font-medium">
        {question.prompt}
        {question.required && <span aria-hidden> *</span>}
      </legend>

      {(question.type === 'single_select' || question.type === 'multi_select') && (
        <ChoiceList
          label={question.prompt}
          choices={question.choices}
          value={answer.choice_keys}
          multiple={question.type === 'multi_select'}
          onChange={(choice_keys) => {
            onChange({ ...answer, choice_keys })
          }}
        />
      )}

      {question.type === 'free_text' && (
        <Textarea
          id={id}
          rows={3}
          aria-label={question.prompt}
          aria-invalid={invalid}
          value={answer.text ?? ''}
          onChange={(event) => {
            onChange({ ...answer, text: event.target.value })
          }}
        />
      )}

      {question.type === 'number' && (
        <Input
          id={id}
          type="number"
          aria-label={question.prompt}
          aria-invalid={invalid}
          value={answer.number ?? ''}
          onChange={(event) => {
            const text = event.target.value
            onChange({ ...answer, number: text === '' ? null : Number(text) })
          }}
        />
      )}

      {needsText && (
        <Input
          aria-label={`More about your choice for "${question.prompt}"`}
          aria-invalid={invalid}
          value={answer.text ?? ''}
          onChange={(event) => {
            onChange({ ...answer, text: event.target.value })
          }}
        />
      )}

      {error !== undefined && (
        <p role="alert" className="text-xs text-destructive-strong">
          {error.message}
        </p>
      )}
    </fieldset>
  )
}
