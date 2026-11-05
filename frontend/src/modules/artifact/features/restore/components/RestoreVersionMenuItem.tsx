'use client'

import { Undo2Icon } from 'lucide-react'

import type { RevisionTarget } from '@/modules/artifact/entities'
import { revisionKeyOf } from '@/modules/artifact/entities'
import { DisabledReason } from '@/shared/components/ui/disabled-reason'
import { DropdownMenuItem } from '@/shared/components/ui/dropdown-menu'

import { useOpenRestoreVersionDialog } from '../hooks/useOpenRestoreVersionDialog'
import { restoreMessages } from '../restore.constants'

interface RestoreVersionMenuItemProps {
  target: RevisionTarget
  version: number
  /** Why the record cannot change now, or null when it can. */
  lockedReason: string | null
}

/**
 * The entry that restores a version of a record, in the menu of its item in the history:
 * disabled with its reason while the record cannot change, and opening the dialog that asks
 * before it restores.
 */
export function RestoreVersionMenuItem({
  target,
  version,
  lockedReason,
}: RestoreVersionMenuItemProps) {
  const openRestore = useOpenRestoreVersionDialog()

  return (
    <DisabledReason reason={lockedReason}>
      <DropdownMenuItem
        disabled={lockedReason !== null}
        onSelect={() => {
          openRestore(revisionKeyOf(target, version))
        }}
      >
        <Undo2Icon />
        {restoreMessages.button}
      </DropdownMenuItem>
    </DisabledReason>
  )
}
