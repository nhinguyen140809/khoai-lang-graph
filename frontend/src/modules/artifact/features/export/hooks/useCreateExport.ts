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

interface CreateExportOptions {
  /** The `setError` of the form, which shows the problems of the API at its fields. */
  setError: UseFormSetError<ExportFormValues>
  /** Runs once the export is asked for. */
  onAsked: () => void
  /** The templates of the definition, which name the file in the toast. */
  templates: readonly ExportTemplate[]
}

/**
 * Asks for an export with the key of the action, which the variables carry, so that the one retry
 * after a network error or a 5xx sends it again. Once asked, it follows the export, opens the toast
 * that says that the file is being prepared, and runs `onAsked`. A refusal shows its problems at
 * the fields through `setError`, and `formError` holds any other failure.
 */
export function useCreateExport(
  projectId: string,
  { setError, onAsked, templates }: CreateExportOptions,
) {
  const follow = useFollowExport()
  const create = useMutation({
    mutationKey: exportKeys.create(),
    mutationFn: ({ body, idempotencyKey }: { body: CreateExportBody; idempotencyKey: string }) =>
      createExport(projectId, body, idempotencyKey),
    retry: canRetryOnce,
    onSuccess: (asked, { body }) => {
      follow(asked.id)
      const template = templates.find(({ key }) => key === body.template)
      toast.loading(exportMessages.preparing(exportFileLabel(template, body.format)), {
        id: exportToastId(asked.id),
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
