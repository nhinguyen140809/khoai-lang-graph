import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { cancelRun, retryRun, sendMessage } from '../session.api'
import { eventLogKeyRoots } from '../session-keys.constants'

/** Reads again what a run changes: the messages, the runs, the steps and the review. */
export function useRefreshEventLog() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      eventLogKeyRoots.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey: [...queryKey] }),
      ),
    )
}

function useActionOptions() {
  const refresh = useRefreshEventLog()
  return {
    onSuccess: () => refresh(),
    onError: (error: Error) => {
      toast.error(error.message)
    },
  }
}

export function useSendMessage(threadId: string) {
  return useMutation({
    mutationFn: (content: string) => sendMessage(threadId, content),
    ...useActionOptions(),
  })
}

export function useStopRun() {
  return useMutation({ mutationFn: cancelRun, ...useActionOptions() })
}

export function useRetryRun() {
  return useMutation({
    mutationFn: ({ runId, stepId }: { runId: string; stepId: string }) => retryRun(runId, stepId),
    ...useActionOptions(),
  })
}
