import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { artifactKeys } from '../../artifacts/artifacts.keys'
import { itemKeys } from '../items.keys'

/** Loads again every list of artifacts and items, and every artifact and item, after a run wrote them. */
export function useReloadArtifacts(): () => Promise<void> {
  const queryClient = useQueryClient()
  return useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: artifactKeys.all() }),
      queryClient.invalidateQueries({ queryKey: itemKeys.all() }),
    ])
  }, [queryClient])
}
