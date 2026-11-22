'use client'

import { ExportDialog, ExportDownloads } from '@/modules/artifact/features/export'

/**
 * The dialog of an export and the downloads of the exports asked for, mounted once by the layout of
 * a project, whatever opens the dialog.
 */
export function ExportDialogs({ projectId }: { projectId: string }) {
  return (
    <>
      <ExportDialog projectId={projectId} />
      <ExportDownloads />
    </>
  )
}
