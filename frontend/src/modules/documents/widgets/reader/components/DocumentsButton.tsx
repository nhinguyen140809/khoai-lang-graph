'use client'

import { FilesIcon } from 'lucide-react'

import { documentsMessages } from '@/modules/documents/entities'
import { Button } from '@/shared/components/ui/button'

import { useOpenReaderView } from '../hooks/useOpenReaderView'

/**
 * The button of the bar of a chat that opens the reader on the list of the documents of the
 * project. On a narrow screen it shows its icon alone.
 */
export function DocumentsButton() {
  const { open } = useOpenReaderView()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        open({ kind: 'documents' })
      }}
    >
      <FilesIcon aria-hidden />
      <span className="max-sm:sr-only">{documentsMessages.title}</span>
    </Button>
  )
}
