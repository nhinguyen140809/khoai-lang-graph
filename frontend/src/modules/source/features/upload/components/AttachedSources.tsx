'use client'

import { FileTextIcon, XIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/shared/components/ui/attachment'
import { Spinner } from '@/shared/components/ui/spinner'
import { formatFileSize } from '@/shared/lib/numbers'

import { useRetained } from '../hooks/useRetained'
import { uploadSourceMessages } from '../upload.constants'

/** What a file waits as: chosen and not yet sent, or on its way to the server. */
type AttachedState = 'idle' | 'uploading'

// One look for each state, looked up and not branched, so that the markup of a file is the same in
// both: the media of the attachment, and what its description says besides the size.
const attachedLooks: Record<AttachedState, { media: ReactNode; note: string | null }> = {
  idle: { media: <FileTextIcon aria-hidden />, note: null },
  uploading: { media: <Spinner />, note: uploadSourceMessages.uploading },
}

interface AttachedSourcesProps {
  files: readonly File[]
  /** Takes a file off; a file on its way up cannot be taken off, so there is no button then. */
  onRemove?: (file: File) => void
  state?: AttachedState
}

/**
 * The files chosen as sources, as the attachments of the design system: dashed until they are sent,
 * with the spinner and a shimmering name while they go up. The last files stay while the list is
 * empty, so that they can leave with the room that holds them.
 */
export function AttachedSources({ files, onRemove, state = 'idle' }: AttachedSourcesProps) {
  const shown = useRetained(files)
  const look = attachedLooks[state]
  if (shown.length === 0) return null

  return (
    <AttachmentGroup role="list" aria-label={uploadSourceMessages.attachments}>
      {shown.map((file) => (
        <Attachment
          key={`${file.name}:${String(file.size)}:${String(file.lastModified)}`}
          role="listitem"
          size="sm"
          state={state}
        >
          <AttachmentMedia>{look.media}</AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{file.name}</AttachmentTitle>
            <AttachmentDescription>{look.note ?? formatFileSize(file.size)}</AttachmentDescription>
          </AttachmentContent>
          {onRemove !== undefined && state === 'idle' && (
            <AttachmentActions>
              <AttachmentAction
                aria-label={uploadSourceMessages.remove(file.name)}
                onClick={() => {
                  onRemove(file)
                }}
              >
                <XIcon aria-hidden />
              </AttachmentAction>
            </AttachmentActions>
          )}
        </Attachment>
      ))}
    </AttachmentGroup>
  )
}
