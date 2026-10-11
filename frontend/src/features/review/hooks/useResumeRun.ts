import { useMutation, useQueryClient } from '@tanstack/react-query'

import { resumeRun } from '../review.api'
import type { ResumeBody } from '../review.types'

/** Answers the review. The run goes on, so what depends on a run is read again. */
export function useResumeRun(runId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ResumeBody) => resumeRun(runId, body),
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
