'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import type { Interrupt, InterruptOption } from '@/modules/review/entities'
import type { Run } from '@/modules/run/entities'
import { ariaKeyShortcuts, isHotkeyPressed } from '@/shared/lib/hotkey'

import { sendFeedbackHotkey } from '../answer-review.constants'
import { answerReviewFormSchema } from '../answer-review.schema'
import type { AnswerReviewFormValues } from '../answer-review.types'
import { defaultOption, feedbackAfterSelect, initialAnswers } from '../answer-review.utils'
import { useAnswerReview } from './useAnswerReview'

/**
 * The form that answers a review: its questions on their own steps, the option it chooses, and
 * one send that finishes the whole answer.
 */
export function useAnswerReviewForm(interrupt: Interrupt, run: Run) {
  const { answer, isPending, isItemsLoading } = useAnswerReview(run, interrupt)
  const isBusy = isPending || isItemsLoading
  const schema = useMemo(() => answerReviewFormSchema(interrupt), [interrupt])
  const startOption = defaultOption(interrupt.options)
  const form = useForm<AnswerReviewFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      option: startOption?.key ?? null,
      feedback: startOption?.suggested_feedback ?? '',
      answers: initialAnswers(interrupt.questions),
    },
  })

  const selectOption = (option: InterruptOption) => {
    if (isBusy) return
    const previous = interrupt.options.find(({ key }) => key === form.getValues('option'))
    form.setValue('feedback', feedbackAfterSelect(form.getValues('feedback'), previous, option))
    form.setValue('option', option.key)
  }

  const send = form.handleSubmit((values) => {
    if (isBusy) return
    answer({ values })
  })

  const sendOnKey = (event: React.KeyboardEvent) => {
    if (!isHotkeyPressed(event.nativeEvent, sendFeedbackHotkey)) return
    event.preventDefault()
    void send()
  }

  return {
    form,
    selectOption,
    send,
    sendOnKey,
    isPending: isBusy,
    keys: ariaKeyShortcuts(sendFeedbackHotkey),
  }
}
