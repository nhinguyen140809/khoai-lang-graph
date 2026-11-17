'use client'

import { useExportDownload } from '../hooks/useExportDownload'
import { useFollowedExports } from '../hooks/useFollowExport'

/** Follows every export asked for in this page, each until its file is ready or failed. Renders nothing visible. */
export function ExportDownloads() {
  const exportIds = useFollowedExports()

  return exportIds.map((exportId) => <ExportDownload key={exportId} exportId={exportId} />)
}

/** Follows one export, whose outcome shows in its toast. */
function ExportDownload({ exportId }: { exportId: string }) {
  useExportDownload(exportId)
  return null
}
