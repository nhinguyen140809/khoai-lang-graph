import { useMutation, useQueryClient } from '@tanstack/react-query'

import { retryFromStep } from '../workflow.api'

/** Starts a new run from a step; what depends on the runs is read again. */
export function useRetryFromStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ runId, stepId }: { runId: string; stepId: string }) =>
      retryFromStep(runId, stepId),
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
