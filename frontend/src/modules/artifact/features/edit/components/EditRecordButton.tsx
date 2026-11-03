'use client'

import { PencilIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'

import type { RevisionTarget } from '@/modules/artifact/entities'
import { Button } from '@/shared/components/ui/button'
import { DisabledReason } from '@/shared/components/ui/disabled-reason'

import { editMessages } from '../edit.constants'
import {
  useEditingActions,
  useEndedEditingKey,
  useFocusReturned,
  useIsAnyEditing,
} from '../hooks/useEditingRecord'

interface EditRecordButtonProps {
  target: RevisionTarget
  /** Why the record cannot change now, or null when it can. */
  lockedReason: string | null
}

/**
 * The outline Edit button of a record: it starts the edit mode of its record, disabled with the
 * reason while the rule of the screen refuses a change. When the edit mode of its record ends, it
 * takes the focus back once, so that the reader continues from where they started.
 */
export function EditRecordButton({ target, lockedReason }: EditRecordButtonProps) {
  const key = `${target.type}:${target.id}`
  const { startEditing } = useEditingActions()
  const isEditing = useIsAnyEditing(key)
  const endedKey = useEndedEditingKey()
  const focusReturned = useFocusReturned()
  const button = useRef<HTMLButtonElement>(null)

  // The edit mode of this record just ended: take the focus once, then say that it is taken.
  useEffect(() => {
    if (endedKey === key && button.current !== null) {
      button.current.focus()
      focusReturned()
    }
  }, [endedKey, key, focusReturned])

  if (isEditing) return null

  return (
    <DisabledReason reason={lockedReason}>
      <Button
        ref={button}
        type="button"
        variant="outline"
        disabled={lockedReason !== null}
        onClick={() => {
          startEditing(target)
        }}
      >
        <PencilIcon data-icon="inline-start" />
        {editMessages.edit}
      </Button>
    </DisabledReason>
  )
}
