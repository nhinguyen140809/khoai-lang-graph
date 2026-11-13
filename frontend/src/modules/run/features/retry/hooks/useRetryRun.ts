import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { retryRun } from '@/modules/run/entities'
import { ApiErrorCode, errorMessageOf } from '@/shared/api/error'
import { newIdempotencyKey } from '@/shared/api/idempotency'

import { retryRunMessages } from '../retry-run.constants'

/**
 * Starts a new run from a step of a run, then loads again every query on the screen, since the
 * new run counts in the thread, the project and the activity. A toast says that the run starts; a
 * failure shows as a toast, and one run at a time is told in its own words.
 */
export function useRetryRun() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ runId, stepId }: { runId: string; stepId: string }) =>
      retryRun(runId, stepId, newIdempotencyKey()),
    onSuccess: async () => {
      // The new run counts in queries of modules above `run`, whose keys it cannot name.
      await queryClient.invalidateQueries()
      toast.success(retryRunMessages.started)
    },
    onError: (error) => {
      toast.error(
        errorMessageOf(error, {
          code: { [ApiErrorCode.RunAlreadyActive]: retryRunMessages.alreadyActive },
        }),
      )
    },
  })
}
