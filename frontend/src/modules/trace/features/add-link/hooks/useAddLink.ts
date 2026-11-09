'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'

import { createTraceLink, traceModuleKeys } from '@/modules/trace/entities'
import { formErrorOf, showFieldProblems } from '@/shared/components/form'

import { addLinkMessages } from '../add-link.constants'
import type { AddLinkFormValues } from '../add-link.schema'
import { addLinkFormSchema } from '../add-link.schema'
import { addLinkBody } from '../add-link.utils'

/**
 * Makes a link from the values of its form. Once the trace module has loaded again with the new
 * link, `onAdded` runs and a toast says it. When the link is refused, the problems of the API show
 * at the field through `setError`, and `formError` holds any other failure, such as the reason of
 * a document that cannot change.
 */
export function useAddLink(
  projectId: string,
  sourceItemId: string,
  setError: UseFormSetError<AddLinkFormValues>,
  onAdded: () => void,
) {
  const queryClient = useQueryClient()
  const add = useMutation({
    mutationFn: (values: AddLinkFormValues) =>
      createTraceLink(projectId, addLinkBody(sourceItemId, values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: traceModuleKeys.all() })
      toast.success(addLinkMessages.added)
      onAdded()
    },
    onError: (error) => {
      showFieldProblems(setError, error, addLinkFormSchema)
    },
  })
  return { ...add, formError: formErrorOf(add.error, addLinkFormSchema) }
}
