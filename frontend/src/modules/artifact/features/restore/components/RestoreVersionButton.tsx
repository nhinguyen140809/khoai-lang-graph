'use client'

import { HistoryIcon } from 'lucide-react'

import type { RevisionTarget } from '@/modules/artifact/entities'
import { revisionKeyOf } from '@/modules/artifact/entities'
import { Button } from '@/shared/components/ui/button'
import { DisabledReason } from '@/shared/components/ui/disabled-reason'

import { useOpenRestoreVersionDialog } from '../hooks/useOpenRestoreVersionDialog'
import { restoreMessages } from '../restore.constants'

interface RestoreVersionButtonProps {
  target: RevisionTarget
  version: number
  /** Why the record cannot change now, or null when it can. */
  lockedReason: string | null
}

/**
 * The control that restores the selected version of a record, in the history surface: a ghost
 * button, disabled with its reason while the record cannot change, which opens the dialog that
 * asks before it restores.
 */
export function RestoreVersionButton({ target, version, lockedReason }: RestoreVersionButtonProps) {
  const openRestore = useOpenRestoreVersionDialog()

  return (
    <DisabledReason reason={lockedReason}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={lockedReason !== null}
        onClick={() => {
          openRestore(revisionKeyOf(target, version))
        }}
      >
        <HistoryIcon data-icon="inline-start" />
        {restoreMessages.button}
      </Button>
    </DisabledReason>
  )
}
