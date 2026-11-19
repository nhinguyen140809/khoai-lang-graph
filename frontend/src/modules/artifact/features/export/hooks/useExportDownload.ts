'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useExport } from '@/modules/artifact/entities'
import { useWorkflowDefinition } from '@/modules/workflow/entities'
import { actionToastDuration } from '@/shared/components/ui/sonner'
import { downloadFile } from '@/shared/lib/url'

import { exportMessages } from '../export.constants'
import { exportFileLabel, exportToastId } from '../export.utils'
import { useForgetExport } from './useFollowExport'
import { useOpenExportDialog } from './useOpenExportDialog'

/**
 * Follows one export until it is ready or failed, then shows its outcome once in its toast and
 * forgets it: a file that is ready downloads by itself, and its toast offers to download it again;
 * an export that failed offers Try again, which opens the dialog on its template, so that the next
 * press of Export sends a new key; a read that fails says that the export could not be checked.
 */
export function useExportDownload(exportId: string) {
  const exported = useExport(exportId)
  const { data: definition } = useWorkflowDefinition()
  const forget = useForgetExport()
  const openDialog = useOpenExportDialog()
  // Each outcome runs once, also when the page renders again before the export is forgotten.
  const isDone = useRef(false)
  const toastId = exportToastId(exportId)

  useEffect(() => {
    if (isDone.current) return
    if (exported.isError) {
      isDone.current = true
      toast.error(exportMessages.unchecked, { id: toastId })
      forget(exportId)
      return
    }
    const asked = exported.data
    if (asked === undefined || asked.status === 'pending') return
    isDone.current = true
    const template = definition?.export_templates.find(({ key }) => key === asked.template)
    const url = asked.download_url
    if (asked.status === 'ready' && url !== null) {
      downloadFile(url, asked.file_name)
      toast.success(exportMessages.ready(exportFileLabel(template, asked.format)), {
        id: toastId,
        duration: actionToastDuration,
        action: {
          label: exportMessages.downloadAgain,
          onClick: () => {
            downloadFile(url, asked.file_name)
          },
        },
      })
    } else {
      toast.error(exportMessages.failed, {
        id: toastId,
        duration: actionToastDuration,
        action: {
          label: exportMessages.tryAgain,
          onClick: () => {
            openDialog(asked.template)
          },
        },
      })
    }
    forget(exportId)
  }, [exported.isError, exported.data, definition, exportId, toastId, forget, openDialog])
}
