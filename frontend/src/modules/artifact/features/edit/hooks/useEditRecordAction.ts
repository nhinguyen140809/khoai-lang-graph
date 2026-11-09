'use client'

import { PencilIcon } from 'lucide-react'

import { type RevisionTarget } from '@/modules/artifact/entities'
import type { MenuAction } from '@/shared/components/ui/menu-action'

import { editMessages } from '../edit.constants'
import { useEditingActions } from './useEditingRecord'

/**
 * The action of editing a record, for a menu: the icon and the words of Edit, the reason it
 * cannot run now, and a run that starts the edit mode of the record. The page hides the menu
 * while the record is edited, and its button takes the focus back when the edit mode ends.
 */
export function useEditRecordAction(
  target: RevisionTarget,
  lockedReason: string | null,
): MenuAction {
  const { startEditing } = useEditingActions()
  return {
    icon: PencilIcon,
    label: editMessages.edit,
    disabledReason: lockedReason,
    run: () => {
      startEditing(target)
    },
  }
}
