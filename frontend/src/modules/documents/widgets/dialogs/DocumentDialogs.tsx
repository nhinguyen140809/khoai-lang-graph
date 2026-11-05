'use client'

import { DiscardChangesDialog, useDiscardChangesDialog } from '@/modules/artifact/features/edit'
import { RestoreVersionDialog, useRestoreVersionDialog } from '@/modules/artifact/features/restore'
import { useReloadTraces } from '@/modules/trace/entities'

/**
 * The dialogs of the edits and the restores of the documents, which the forms, the history
 * surface and the link cards open through their stores. The layout of a project mounts it once,
 * after ProjectDialogs, so that the screen has one of each, whatever opens it. A restore reloads
 * the traces, so the widget sits in `documents`.
 */
export function DocumentDialogs() {
  const discard = useDiscardChangesDialog()
  const restore = useRestoreVersionDialog()
  const reloadTraces = useReloadTraces()

  return (
    <>
      <DiscardChangesDialog
        open={discard.open}
        onOpenChange={discard.setOpen}
        onClosed={discard.closed}
      />
      {restore.targetId !== null && (
        <RestoreVersionDialog
          key={restore.targetId}
          revisionKey={restore.targetId}
          open={restore.open}
          onOpenChange={restore.setOpen}
          onClosed={restore.closed}
          onChanged={reloadTraces}
        />
      )}
    </>
  )
}
