'use client'

import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query'
import type { UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'

import {
  type ArtifactItem,
  itemKeys,
  updateItem,
  type UpdateItemBody,
  useApplyRecordChange,
} from '@/modules/artifact/entities'
import { formErrorOf, showFieldProblems } from '@/shared/components/form'

import { editMessages } from '../edit.constants'
import { isVersionConflict } from '../edit.utils'
import { type EditItemFormValues } from '../schemas/edit-item.schema'
import { useEditingActions } from './useEditingRecord'

/** What a save of the form of a record needs: where its problems show, its schema, and what follows a change. */
interface UpdateOptions {
  setError: UseFormSetError<EditItemFormValues>
  schema: z.ZodType
  /** Runs after the answer is in the cache and the records have loaded again, such as the reload of the traces. */
  onChanged: () => Promise<void> | void
}

/**
 * Saves the changes of an item from its form. On success the detail takes the answer, the lists and
 * the details of artifacts and items load again, `onChanged` runs, a toast says it, and the edit
 * mode ends. A failure shows its problems at the fields through `setError`; `formError`,
 * `isConflict` and `reload` tell the form the rest.
 */
export function useUpdateItem(
  item: Pick<ArtifactItem, 'id' | 'version'>,
  { setError, schema, onChanged }: UpdateOptions,
): UseMutationResult<ArtifactItem, Error, UpdateItemBody> & {
  formError: string | null
  isConflict: boolean
  reload: () => void
} {
  const applyRecordChange = useApplyRecordChange()
  const queryClient = useQueryClient()
  const { stopEditing } = useEditingActions()

  const save = useMutation({
    mutationFn: (change: UpdateItemBody) => updateItem(item.id, item.version, change),
    onSuccess: async (saved) => {
      await applyRecordChange({ type: 'item', record: saved })
      await onChanged()
      toast.success(editMessages.saved)
      stopEditing()
    },
    onError: (error) => {
      showFieldProblems(setError, error, schema)
    },
  })

  return {
    ...save,
    formError: formErrorOf(save.error, schema),
    isConflict: isVersionConflict(save.error),
    reload: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.detail(item.id) })
    },
  }
}
