'use client'

import { useCallback, useState } from 'react'

import type { ExportFormat } from '@/modules/workflow/entities/@x/artifact'
import { apiEndpoints } from '@/shared/api/endpoints'

import { createExport, getExport } from '../exports.api'

// How long the download waits before it asks whether the file of the export is ready.
const POLL_MS = 500
const TRIES = 40

/**
 * Asks for an export, waits for its file and sends the browser to it. The file answers on a
 * same-origin path that carries the session cookie, so a plain navigation downloads it with the
 * name the server gave.
 */
export function useDownloadExport(projectId: string) {
  const [pending, setPending] = useState<ExportFormat | null>(null)

  const download = useCallback(
    async (template: string, format: ExportFormat) => {
      setPending(format)
      try {
        let document = await createExport(
          projectId,
          { template, format },
          crypto.randomUUID(),
        )
        for (let attempt = 0; attempt < TRIES && document.status === 'pending'; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, POLL_MS))
          document = await getExport(document.id)
        }
        if (document.status !== 'ready') {
          throw new Error('The file of the export could not be prepared.')
        }
        window.location.assign(apiEndpoints.exportEntryFile.path({ exportId: document.id }))
      } finally {
        setPending(null)
      }
    },
    [projectId],
  )

  return { download, pending }
}
