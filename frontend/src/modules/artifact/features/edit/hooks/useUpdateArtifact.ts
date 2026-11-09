'use client'

import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query'
import type { UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'

import {
  type Artifact,
  artifactKeys,
  updateArtifact,
  type UpdateArtifactBody,
  useApplyRecordChange,
} from '@/modules/artifact/entities'
import { isVersionConflict } from '@/shared/api/error'
import { formErrorOf, showFieldProblems } from '@/shared/components/form'

import { editMessages } from '../edit.constants'
import { type EditArtifactFormValues } from '../schemas/edit-artifact.schema'
import { useEditingActions } from './useEditingRecord'

/** What a save of the form of a record needs: where its problems show, its schema, and what follows a change. */
interface UpdateOptions {
  setError: UseFormSetError<EditArtifactFormValues>
  schema: z.ZodType
  /** Runs after the answer is in the cache and the records have loaded again, such as the reload of the traces. */
  onChanged: () => Promise<void> | void
}

/**
 * Saves the changes of an artifact from its form. On success the detail takes the answer, the
 * lists and the details of artifacts and items load again, `onChanged` runs, a toast says it, and
 * the edit mode ends. A failure shows its problems at the fields through `setError`; `formError`,
 * `isConflict` and `reload` tell the form the rest.
 */
export function useUpdateArtifact(
  artifact: Pick<Artifact, 'id' | 'version'>,
  { setError, schema, onChanged }: UpdateOptions,
): UseMutationResult<Artifact, Error, UpdateArtifactBody> & {
  formError: string | null
  isConflict: boolean
  reload: () => void
} {
  const applyRecordChange = useApplyRecordChange()
  const queryClient = useQueryClient()
  const { stopEditing } = useEditingActions()

  const save = useMutation({
    mutationFn: (change: UpdateArtifactBody) =>
      updateArtifact(artifact.id, artifact.version, change),
    onSuccess: async (saved) => {
      await applyRecordChange({ type: 'artifact', record: saved })
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
      void queryClient.invalidateQueries({ queryKey: artifactKeys.detail(artifact.id) })
    },
  }
}
