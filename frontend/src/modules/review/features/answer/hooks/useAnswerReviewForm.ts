'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import type { Interrupt } from '@/modules/review/entities'
import type { Run } from '@/modules/run/entities'
import type { CheckpointOption } from '@/modules/workflow/entities'
import { ariaKeyShortcuts, isHotkeyPressed } from '@/shared/lib/hotkey'

import { answerReviewMessages, sendFeedbackHotkey } from '../answer-review.constants'
import { answerReviewFormSchema } from '../answer-review.schema'
import type { AnswerReviewFormValues } from '../answer-review.types'
import { defaultOption, initialAnswers } from '../answer-review.utils'
import { useAnswerReview } from './useAnswerReview'

/**
 * The form that answers a review: its questions on their own steps, the option it chooses, and
 * one send that finishes the whole answer.
 */
export function useAnswerReviewForm(interrupt: Interrupt, run: Run) {
  const { answer, isPending, isItemsLoading } = useAnswerReview(run, interrupt)
  const isBusy = isPending || isItemsLoading
  const schema = useMemo(() => answerReviewFormSchema(interrupt), [interrupt])
  const form = useForm<AnswerReviewFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      option: defaultOption(interrupt.options)?.key ?? null,
      feedback: '',
      answers: initialAnswers(interrupt.questions),
    },
  })

  const selectOption = (option: CheckpointOption) => {
    if (isBusy) return
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
    words: answerReviewMessages,
  }
}
