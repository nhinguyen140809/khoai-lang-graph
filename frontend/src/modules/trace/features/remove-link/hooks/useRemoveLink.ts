'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteTraceLink, traceModuleKeys } from '@/modules/trace/entities'
import { errorMessageOf } from '@/shared/api/error'

import { removeLinkMessages } from '../remove-link.constants'

/**
 * Removes a link by its id. Once the trace module has loaded again without the link, `onRemoved`
 * runs and a toast says it. A failure shows as a toast, in the words of the error, and leaves
 * the dialog open for another try.
 */
export function useRemoveLink(onRemoved: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (linkId: string) => deleteTraceLink(linkId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: traceModuleKeys.all() })
      toast.success(removeLinkMessages.removed)
      onRemoved()
    },
    onError: (error) => {
      toast.error(errorMessageOf(error, {}))
    },
  })
}
