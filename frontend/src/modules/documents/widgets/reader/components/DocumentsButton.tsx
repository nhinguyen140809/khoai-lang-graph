'use client'

import { FilesIcon } from 'lucide-react'

import { documentsMessages } from '@/modules/documents/entities'
import { Button } from '@/shared/components/ui/button'

import { useReaderView } from '../hooks/useReaderView'

/**
 * The button of the bar of a chat that shows and hides the reader: it opens the reader on the list
 * of the documents of the project, and closes it while it is open, when the button shows as
 * pressed. On a narrow screen it shows its icon alone.
 */
export function DocumentsButton() {
  const { view, open, close } = useReaderView()
  const isOpen = view !== null

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-expanded={isOpen}
      onClick={() => {
        if (isOpen) close()
        else open({ kind: 'documents' })
      }}
    >
      <FilesIcon aria-hidden />
      <span className="max-sm:sr-only">{documentsMessages.title}</span>
    </Button>
  )
}
