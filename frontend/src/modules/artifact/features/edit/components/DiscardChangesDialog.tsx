'use client'

import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'

import { editMessages } from '../edit.constants'
import { useEditingActions } from '../hooks/useEditingRecord'

interface DiscardChangesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Runs once the dialog has closed, after its animation. */
  onClosed: () => void
}

/**
 * The dialog that asks before the changes of a form are dropped: Discard ends the edit mode, Keep
 * editing closes the dialog and leaves the form as it was. It reads no record; its target is the
 * key of the record being edited, which the store of the form gave.
 */
export function DiscardChangesDialog({ open, onOpenChange, onClosed }: DiscardChangesDialogProps) {
  const { stopEditing } = useEditingActions()

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onClosed={onClosed}
      destructive
      title={editMessages.discard.title}
      description={editMessages.discard.description}
      confirmLabel={editMessages.discard.confirm}
      cancelLabel={editMessages.discard.cancel}
      onConfirm={() => {
        stopEditing()
      }}
    />
  )
}
