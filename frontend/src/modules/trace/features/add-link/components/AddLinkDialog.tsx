'use client'

import { Link2Icon } from 'lucide-react'

import type { ArtifactItem } from '@/modules/artifact/entities'
import { useItemTitleOf } from '@/modules/workflow/entities'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

import { addLinkMessages } from '../add-link.constants'
import { AddLinkForm } from './AddLinkForm'

interface AddLinkDialogProps {
  projectId: string
  /** The item that the link starts from. */
  source: ArtifactItem
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Runs once the dialog has closed, after its animation. */
  onClosed?: () => void
}

/**
 * Links an item to another, from the menu of its page or of a node of its chain, which open it
 * through `TraceDialogs`: the kind of link, the other item found by search, and an optional note.
 * Once both are chosen, the sentence of the link reads what it will say.
 */
export function AddLinkDialog({
  projectId,
  source,
  open,
  onOpenChange,
  onClosed,
}: AddLinkDialogProps) {
  const titleOf = useItemTitleOf()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" onCloseAutoFocus={() => onClosed?.()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2Icon aria-hidden className="size-4" />
            {addLinkMessages.title(titleOf(source))}
          </DialogTitle>
          <DialogDescription>{addLinkMessages.description}</DialogDescription>
        </DialogHeader>
        <AddLinkForm
          projectId={projectId}
          source={source}
          onAdded={() => {
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
