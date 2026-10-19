import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createRun } from '@/modules/run/entities'
import { errorMessageOf } from '@/shared/api/api-error.utils'

/** Starts a run of the thread with a prompt; a failure shows as a toast. */
export function useStartRun(threadId: string) {
  return useMutation({
    mutationFn: (prompt: string) => createRun(threadId, prompt),
    onError: (error) => {
      toast.error(errorMessageOf(error, {}))
    },
  })
}
