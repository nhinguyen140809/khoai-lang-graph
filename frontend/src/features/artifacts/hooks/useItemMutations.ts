import { useMutation, useQueryClient } from '@tanstack/react-query'

import { restoreItem, updateItem } from '../artifacts.api'
import type { ArtifactItem } from '../artifacts.types'

/** Reads again what a change of an item changes: the item, its lists, its history and its trace. */
function useRefreshItem() {
  const queryClient = useQueryClient()
  return (item: ArtifactItem) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['artifacts', 'item', item.id] }),
      queryClient.invalidateQueries({ queryKey: ['artifacts', 'items', item.artifact_id] }),
      queryClient.invalidateQueries({ queryKey: ['artifacts', 'revisions', item.id] }),
      queryClient.invalidateQueries({ queryKey: ['artifacts', 'trace'] }),
      queryClient.invalidateQueries({ queryKey: ['artifacts', 'artifact', item.artifact_id] }),
    ])
}

export function useUpdateItem(item: ArtifactItem) {
  const refresh = useRefreshItem()
  return useMutation({
    mutationFn: (content: Record<string, unknown>) => updateItem(item.id, item.version, content),
    onSuccess: (saved) => refresh(saved),
  })
}

export function useRestoreItem(item: ArtifactItem) {
  const refresh = useRefreshItem()
  return useMutation({
    mutationFn: (version: number) => restoreItem(item.id, version),
    onSuccess: (saved) => refresh(saved),
  })
}
