'use client'

import { DownloadIcon } from 'lucide-react'

import { useWorkflowDefinition } from '@/modules/workflow/entities'
import { Button } from '@/shared/components/ui/button'

import { exportMessages } from '../export.constants'
import { useOpenExportDialog } from '../hooks/useOpenExportDialog'

/**
 * Exports the documents of a project: it opens the dialog of an export on the first template of the
 * definition, where another one can be chosen. Nothing shows while the definition loads or when it
 * has no template. On a narrow screen it shows its icon alone.
 */
export function ExportProjectButton() {
  const { data: definition } = useWorkflowDefinition()
  const openDialog = useOpenExportDialog()
  const [first] = definition?.export_templates ?? []

  if (first === undefined) return null
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        openDialog(first.key)
      }}
    >
      <DownloadIcon aria-hidden />
      <span className="max-sm:sr-only">{exportMessages.button}</span>
    </Button>
  )
}
