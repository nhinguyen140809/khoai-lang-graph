'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { artifactKeys } from '../../artifacts/artifacts.keys'
import type { Artifact } from '../../artifacts/artifacts.types'
import { itemKeys } from '../items.keys'
import type { ArtifactItem } from '../items.types'

/** A record that a change answered: an item or an artifact. */
export type RecordChange =
  { type: 'item'; record: ArtifactItem } | { type: 'artifact'; record: Artifact }

/**
 * Puts a changed record in the cache, then loads again every list and detail of artifacts and
 * items, with their revisions: the tree reads the new status and the record moved to a new
 * version. Settles once they have loaded.
 */
export function useApplyRecordChange(): (change: RecordChange) => Promise<void> {
  const queryClient = useQueryClient()
  return useCallback(
    async (change) => {
      const key =
        change.type === 'item'
          ? itemKeys.detail(change.record.id)
          : artifactKeys.detail(change.record.id)
      queryClient.setQueryData(key, change.record)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: artifactKeys.all() }),
        queryClient.invalidateQueries({ queryKey: itemKeys.all() }),
      ])
    },
    [queryClient],
  )
}
