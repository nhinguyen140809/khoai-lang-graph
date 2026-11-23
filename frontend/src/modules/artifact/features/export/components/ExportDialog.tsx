'use client'

import { useWorkflowDefinition } from '@/modules/workflow/entities'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'

import { exportMessages } from '../export.constants'
import { useIsExporting } from '../hooks/useCreateExport'
import { useExportDialog } from '../hooks/useOpenExportDialog'
import { ExportForm } from './ExportForm'

/**
 * Asks which documents to export, and in which file type each: one on the screen, mounted by
 * `ExportDialogs` and opened with a template. While the request is pending it does not close, so
 * that an export never starts behind a dialog that the user closed.
 */
export function ExportDialog({ projectId }: { projectId: string }) {
  const dialog = useExportDialog()
  const { data: definition } = useWorkflowDefinition()
  const isExporting = useIsExporting()

  if (dialog.targetId === null || definition === undefined) return null

  return (
    <Dialog
      open={dialog.open}
      onOpenChange={(open) => {
        if (!isExporting) dialog.setOpen(open)
      }}
    >
      {/* The title says it all: a description would only repeat the button. */}
      <DialogContent size="md" aria-describedby={undefined} onCloseAutoFocus={dialog.closed}>
        <DialogHeader>
          <DialogTitle>{exportMessages.dialogTitle}</DialogTitle>
        </DialogHeader>
        <ExportForm
          key={dialog.targetId}
          projectId={projectId}
          templateKey={dialog.targetId}
          templates={definition.export_templates}
          onOpenChange={dialog.setOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
