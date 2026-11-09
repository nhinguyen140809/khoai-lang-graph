'use client'

import { Undo2Icon } from 'lucide-react'

import type { RevisionTarget } from '@/modules/artifact/entities'
import { revisionKeyOf } from '@/modules/artifact/entities'
import { DropdownActionItem } from '@/shared/components/ui/menu-action'

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
    <DropdownActionItem
      icon={Undo2Icon}
      label={restoreMessages.button}
      disabledReason={lockedReason}
      onSelect={() => {
        openRestore(revisionKeyOf(target, version))
      }}
    />
  )
}
