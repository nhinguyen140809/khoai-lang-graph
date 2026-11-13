'use client'

import { useIsFetching, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { artifactKeys, itemKeys, useEditedItems } from '@/modules/artifact/entities'
import {
  type Interrupt,
  interruptKeys,
  resumeRun,
  type ResumeRunBody,
} from '@/modules/review/entities'
import { type Run, runKeys } from '@/modules/run/entities'
import { errorMessageOf } from '@/shared/api/error'
import { newIdempotencyKey } from '@/shared/api/idempotency'

import { answerReviewMessages } from '../answer-review.constants'
import type { AnswerReviewFormValues } from '../answer-review.types'
import { problemsOf, resumeRunBody } from '../answer-review.utils'

/**
 * Answers the pending review of a run: sends the answer, shows a toast, and loads the run, its
 * interrupts and the documents again, since an approving option approves what is still draft.
 */
export function useAnswerReview(run: Run, interrupt: Pick<Interrupt, 'review_artifacts'>) {
  const queryClient = useQueryClient()
  const edited = useEditedItems(interrupt.review_artifacts.map(({ artifact_id }) => artifact_id))
  const isItemsLoading = useIsFetching({ queryKey: itemKeys.lists() }) > 0

  const mutation = useMutation({
    mutationFn: ({
      values,
      idempotencyKey,
    }: {
      values: AnswerReviewFormValues
      idempotencyKey: string
    }) => {
      const body: ResumeRunBody = resumeRunBody(interrupt as Interrupt, values, edited)
      return resumeRun(run.id, body, idempotencyKey)
    },
    onSuccess: async () => {
      toast.success(answerReviewMessages.sent)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: interruptKeys.all() }),
        queryClient.invalidateQueries({ queryKey: runKeys.all() }),
        queryClient.invalidateQueries({ queryKey: artifactKeys.all() }),
        queryClient.invalidateQueries({ queryKey: itemKeys.all() }),
      ])
    },
    onError: async (error) => {
      toast.error(`${answerReviewMessages.notSent} ${errorMessageOf(error, {})}`, {
        description: problemsOf(error),
      })
      // Another tab may have answered first: the interrupts load again either way.
      await queryClient.invalidateQueries({ queryKey: interruptKeys.all() })
    },
  })

  return {
    answer: ({ values }: { values: AnswerReviewFormValues }) => {
      mutation.mutate({ values, idempotencyKey: newIdempotencyKey() })
    },
    isPending: mutation.isPending,
    isItemsLoading,
  }
}
