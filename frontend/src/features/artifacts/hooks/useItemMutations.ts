import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseFormSetError } from 'react-hook-form'
import type { z } from 'zod'

import { type FieldOf, formErrorOf, showFieldProblems } from '@/shared/components/form'

import { restoreItem, updateItem } from '../artifacts.api'
import type { ItemForm } from '../artifacts.schema'
import type { ArtifactItem } from '../artifacts.types'

// The API names a field of an item under `content`, and the edit form names it alone.
const fieldOfContent: FieldOf = (field) => field.replace(/^content\./, '')

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

/**
 * Saves the content of an item as its next version; the problems of the API show at the fields of
 * the edit form, whose schema depends on the kind of the item.
 */
export function useUpdateItem(
  item: ArtifactItem,
  setError: UseFormSetError<ItemForm>,
  schema: z.ZodType,
) {
  const refresh = useRefreshItem()
  const update = useMutation({
    mutationFn: (content: Record<string, unknown>) => updateItem(item.id, item.version, content),
    onSuccess: (saved) => refresh(saved),
    onError: (error) => {
      showFieldProblems(setError, error, schema, fieldOfContent)
    },
  })
  return { ...update, formError: formErrorOf(update.error, schema, fieldOfContent) }
}

export function useRestoreItem(item: ArtifactItem) {
  const refresh = useRefreshItem()
  return useMutation({
    mutationFn: (version: number) => restoreItem(item.id, version),
    onSuccess: (saved) => refresh(saved),
  })
}
