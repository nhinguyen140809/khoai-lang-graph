import { useIsMutating, useMutation } from '@tanstack/react-query'
import type { UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'

import { createExport, type CreateExportBody, exportKeys } from '@/modules/artifact/entities'
import type { ExportTemplate } from '@/modules/workflow/entities'
import { canRetryOnce } from '@/shared/api/query-client'
import { formErrorOf, showFieldProblems } from '@/shared/components/form'

import { exportMessages } from '../export.constants'
import { exportFormSchema, type ExportFormValues } from '../export.schema'
import { exportFileLabel, exportToastId } from '../export.utils'
import { useFollowExport } from './useFollowExport'

/** One export to ask for, with the key that makes its retry safe. */
interface ExportRequest {
  body: CreateExportBody
  idempotencyKey: string
}

interface CreateExportOptions {
  /** The `setError` of the form, which shows the problems of the API at its fields. */
  setError: UseFormSetError<ExportFormValues>
  /** Runs once the export is asked for. */
  onAsked: () => void
  /** The templates of the definition, which name the file in the toast. */
  templates: readonly ExportTemplate[]
}

/**
 * Asks for the exports of a form, each with its own key, which the variables carry, so that the one
 * retry after a network error or a 5xx sends them again. Once asked, it follows each export, opens
 * the toast that says that its file is being prepared, and runs `onAsked`. A refusal shows its problems at
 * the fields through `setError`, and `formError` holds any other failure.
 */
export function useCreateExport(
  projectId: string,
  { setError, onAsked, templates }: CreateExportOptions,
) {
  const follow = useFollowExport()
  const create = useMutation({
    mutationKey: exportKeys.create(),
    mutationFn: (requests: ExportRequest[]) =>
      Promise.all(
        requests.map(({ body, idempotencyKey }) => createExport(projectId, body, idempotencyKey)),
      ),
    retry: canRetryOnce,
    onSuccess: (asked, requests) => {
      asked.forEach(({ id }, index) => {
        follow(id)
        const body = requests[index]?.body
        const template = templates.find(({ key }) => key === body?.template)
        toast.loading(exportMessages.preparing(exportFileLabel(template, body?.format ?? 'json')), {
          id: exportToastId(id),
        })
      })
      onAsked()
    },
    onError: (error) => {
      showFieldProblems(setError, error, exportFormSchema)
    },
  })
  return { ...create, formError: formErrorOf(create.error, exportFormSchema) }
}

/** Whether an export is being asked for, for the dialog that asks for it, which stays open meanwhile. */
export function useIsExporting(): boolean {
  return useIsMutating({ mutationKey: exportKeys.create() }) > 0
}
