'use client'

import { FilesIcon } from 'lucide-react'
import { useMemo } from 'react'

import { documentsMessages } from '@/modules/documents/entities'
import { useDeskTool } from '@/shared/components/frame'

import { useReaderView } from '../hooks/useReaderView'

/**
 * Offers the documents of the project as a tool of the desk while it is mounted, and renders
 * nothing in place: the desk shows it as a button of its bar or an icon of its rail. The tool opens
 * the reader on the list of the documents of the project, and closes it while it is open, when the
 * tool shows as pressed.
 * @view user
 */
export function DocumentsTool() {
  const { view, open, close } = useReaderView()
  const isOpen = view !== null
  const icon = useMemo(() => <FilesIcon aria-hidden />, [])

  useDeskTool({
    id: 'documents',
    label: documentsMessages.title,
    icon,
    isActive: isOpen,
    onSelect: () => {
      if (isOpen) close()
      else open({ kind: 'documents' })
    },
  })

  return null
}
