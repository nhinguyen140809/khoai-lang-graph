'use client'

import { Alert } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { DisabledReason } from '@/shared/components/ui/disabled-reason'
import { PendingButton } from '@/shared/components/ui/pending-button'

import { editMessages } from '../edit.constants'

interface EditFormFooterProps {
  /** Whether the form holds no change. */
  isClean: boolean
  /** Whether the save is running. */
  isSaving: boolean
  /** Why the record cannot change now, shown beside a Save that it disables; null when it can. */
  lockReason: string | null
  /** The conflict of a version: its words, and the reload of the detail. */
  conflict: { isConflict: boolean; message: string; onReload: () => void }
  /** Any other failure of the form, shown under it. */
  formError: string | null
  /** Ends the edit mode on a clean form; on a dirty one it opens the dialog that asks. */
  onCancel: () => void
}

/**
 * The footer of an edit form: Save, which stays pending while it runs and disabled while the
 * form holds no change, with the words that say so, or the record cannot change, with its reason;
 * Cancel, which ends the edit
 * mode on a clean form and asks before it drops a dirty one; the alert of a version conflict,
 * which offers to load the new version, and any other failure of the form.
 */
export function EditFormFooter({
  isClean,
  isSaving,
  lockReason,
  conflict,
  formError,
  onCancel,
}: EditFormFooterProps) {
  const isLocked = isClean || lockReason !== null

  return (
    <div className="space-y-4">
      {conflict.isConflict && (
        <Alert>
          <p>{conflict.message}</p>
          <p>{editMessages.conflict.lost}</p>
          <Button type="button" variant="outline" size="sm" onClick={conflict.onReload}>
            {editMessages.conflict.reload}
          </Button>
        </Alert>
      )}
      {formError !== null && <p className="text-sm text-destructive">{formError}</p>}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {editMessages.cancel}
        </Button>
        <DisabledReason reason={isLocked ? (lockReason ?? editMessages.saveClean) : null}>
          <PendingButton
            type="submit"
            disabled={isLocked}
            pending={isSaving}
            pendingLabel={editMessages.saving}
          >
            {editMessages.save}
          </PendingButton>
        </DisabledReason>
      </div>
    </div>
  )
}
