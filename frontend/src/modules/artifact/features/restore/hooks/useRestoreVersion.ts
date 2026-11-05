'use client'

import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import {
  type Artifact,
  type ArtifactItem,
  restoreArtifact,
  restoreItem,
  useApplyRecordChange,
} from '@/modules/artifact/entities'

/** Restores a version of an item; the answer replaces the detail and the artifacts and items load again. */
export function useRestoreVersion(
  target: { type: 'item' | 'artifact'; id: string },
  { onChanged }: { onChanged: () => Promise<void> | void },
): UseMutationResult<ArtifactItem | Artifact, Error, number> {
  const applyRecordChange = useApplyRecordChange()

  return useMutation({
    mutationFn: async (version: number): Promise<ArtifactItem | Artifact> =>
      target.type === 'item'
        ? restoreItem(target.id, version)
        : restoreArtifact(target.id, version),
    onSuccess: async (saved) => {
      await applyRecordChange(
        target.type === 'item'
          ? { type: 'item', record: saved as ArtifactItem }
          : { type: 'artifact', record: saved as Artifact },
      )
      await onChanged()
    },
  })
}
