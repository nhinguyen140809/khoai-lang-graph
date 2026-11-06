'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { isRunDefaultsEmpty, type RunDefaults, runKeys } from '@/modules/run/entities'
import {
  hasUnfinishedRun,
  messageKeys,
  sendFirstMessage,
  sendMessage,
  type Thread,
  threadKeys,
} from '@/modules/thread/entities'
import { errorMessageOf } from '@/shared/api/error'
import { newIdempotencyKey } from '@/shared/api/idempotency'

import { sendMessageMessages } from './send-message.constants'

/**
 * Sends a message of the user to the thread of the activity, or to a new thread of the project
 * when it has none, with the run settings given for a run that it starts. Once sent, `onSent`
 * runs, and the messages of the thread, the thread and its runs load again; a failure shows as a
 * toast.
 */
export function useSendMessage({
  projectId,
  thread,
}: {
  projectId: string
  thread: Thread | null
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({
      content,
      runConfig,
      idempotencyKey,
    }: {
      content: string
      runConfig: RunDefaults | undefined
      onSent: () => void
      idempotencyKey: string
    }) => {
      const body = {
        content,
        // The settings apply to the run that the message starts, never to one that already runs.
        ...(runConfig !== undefined &&
          !hasUnfinishedRun(thread) &&
          !isRunDefaultsEmpty(runConfig) && { run_config: runConfig }),
      }
      await (thread === null
        ? sendFirstMessage(projectId, body, idempotencyKey)
        : sendMessage(thread.id, body, idempotencyKey))
    },
    onSuccess: async (_answer, { onSent }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: messageKeys.all() }),
        queryClient.invalidateQueries({ queryKey: threadKeys.all() }),
        queryClient.invalidateQueries({ queryKey: runKeys.all() }),
      ])
      onSent()
    },
    onError: (error) => {
      toast.error(`${sendMessageMessages.notSent} ${errorMessageOf(error, {})}`)
    },
  })

  return {
    send: (
      content: string,
      { runConfig, onSent }: { runConfig: RunDefaults | undefined; onSent: () => void },
    ) => {
      mutation.mutate({ content, runConfig, onSent, idempotencyKey: newIdempotencyKey() })
    },
    isPending: mutation.isPending,
  }
}
