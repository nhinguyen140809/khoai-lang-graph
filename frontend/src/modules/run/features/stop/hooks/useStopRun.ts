import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { cancelRun } from '@/modules/run/entities'
import { errorMessageOf } from '@/shared/api/api-error.utils'

import { stopRunMessages } from '../stop-run.constants'

/**
 * Stops a run, then loads again every query on the screen, since the status of the run counts in
 * the threads, the projects and the costs; `mutateAsync` settles once they have loaded. A toast
 * says that the run stopped; a failure shows as a toast, and `mutateAsync` rejects.
 */
export function useStopRun() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (runId: string) => cancelRun(runId),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      toast.success(stopRunMessages.stopped)
    },
    onError: (error) => {
      toast.error(errorMessageOf(error, {}))
    },
  })
}
