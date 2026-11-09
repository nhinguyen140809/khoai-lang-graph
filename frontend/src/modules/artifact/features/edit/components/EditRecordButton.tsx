'use client'

import { useRef } from 'react'

import type { RevisionTarget } from '@/modules/artifact/entities'
import { ActionIconButton } from '@/shared/components/ui/menu-action'

import { useIsAnyEditing } from '../hooks/useEditingRecord'
import { useEditRecordAction } from '../hooks/useEditRecordAction'
import { useFocusOnEditEnd } from '../hooks/useFocusOnEditEnd'

interface EditRecordButtonProps {
  target: RevisionTarget
  /** Why the record cannot change now, or null when it can. */
  lockedReason: string | null
}

/**
 * The quiet Edit button of a record: an icon alone, muted until it is hovered, that says Edit in
 * its tooltip, or the reason while the rule of the screen refuses a change. It starts the edit
 * mode of its record, and takes the focus back once when that edit mode ends.
 */
export function EditRecordButton({ target, lockedReason }: EditRecordButtonProps) {
  const key = `${target.type}:${target.id}`
  const editAction = useEditRecordAction(target, lockedReason)
  const isEditing = useIsAnyEditing(key)
  const button = useRef<HTMLButtonElement>(null)
  useFocusOnEditEnd(key, button)

  if (isEditing) return null

  return <ActionIconButton ref={button} size="icon" action={editAction} />
}
