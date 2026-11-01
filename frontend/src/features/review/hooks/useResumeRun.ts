import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseFormSetError } from 'react-hook-form'
import type { z } from 'zod'

import { formErrorOf, showFieldProblems } from '@/shared/components/form'

import { resumeRun } from '../review.api'
import type { ReviewForm } from '../review.schema'
import type { ResumeBody } from '../review.types'

interface ResumeForm {
  setError: UseFormSetError<ReviewForm>
  schema: z.ZodType
  /** Runs once the run has the answer, also when the answer has taken the review off the screen. */
  onAnswered: () => void
}

/**
 * Answers the review. The run goes on, so what depends on a run is read again. The problems of the
 * API show at the fields of the form, and `formError` holds any other failure.
 */
export function useResumeRun(runId: string, form: ResumeForm) {
  const queryClient = useQueryClient()
  const resume = useMutation({
    mutationFn: (body: ResumeBody) => resumeRun(runId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      form.onAnswered()
    },
    onError: (error) => {
      showFieldProblems(form.setError, error, form.schema)
    },
  })
  return { ...resume, formError: formErrorOf(resume.error, form.schema) }
}
