'use client'

import { toast } from 'sonner'

import { parseRevisionKey } from '@/modules/artifact/entities'
import { ApiErrorCode, errorMessageOf } from '@/shared/api/error'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'

import { useRestoreVersion } from '../hooks/useRestoreVersion'
import { restoreMessages } from '../restore.constants'

interface RestoreVersionDialogProps {
  /** The key of the version to restore, as `revisionKeyOf` writes it. */
  revisionKey: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Runs once the dialog has closed, after its animation. */
  onClosed: () => void
  /** Runs after the answer is in the cache and the records have loaded again, such as the reload of the traces. */
  onChanged: () => Promise<void> | void
}

/**
 * The dialog that restores a version of a record: not red, since the current content stays in the
 * history and restoring again undoes the action. On success the history stays open with the new
 * version on top; on a failure the dialog stays and a toast says why.
 */
export function RestoreVersionDialog({
  revisionKey,
  open,
  onOpenChange,
  onClosed,
  onChanged,
}: RestoreVersionDialogProps) {
  const parsed = parseRevisionKey(revisionKey)
  const target = parsed?.target ?? { type: 'item', id: '' }
  const version = parsed?.version ?? 0

  const restore = useRestoreVersion(target, { onChanged })
  const isItem = target.type === 'item'

  if (parsed === null) return null

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onClosed={onClosed}
      title={isItem ? restoreMessages.itemTitle(version) : restoreMessages.artifactTitle(version)}
      description={
        isItem
          ? restoreMessages.itemDescription(version)
          : restoreMessages.artifactDescription(version)
      }
      confirmLabel={restoreMessages.confirm}
      onConfirm={() => {
        restore.mutate(version, {
          onSuccess: () => {
            toast.success(restoreMessages.restored(version))
            onOpenChange(false)
          },
          onError: (error) => {
            toast.error(
              errorMessageOf(error, {
                code: { [ApiErrorCode.InvalidState]: restoreMessages.locked },
              }),
            )
          },
        })
      }}
    />
  )
}
