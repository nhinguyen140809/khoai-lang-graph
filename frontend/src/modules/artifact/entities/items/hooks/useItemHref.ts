'use client'

import type { Route } from 'next'
import { useCallback, useMemo } from 'react'

import {
  contentSchemasByKind,
  isNavigable,
  useArtifactKinds,
} from '@/modules/workflow/entities/@x/artifact'
import { routes } from '@/shared/routes'

/** The item whose address is asked: its id, its kind and the artifact that holds it. */
interface AddressedItem {
  id: string
  kind: string
  artifact_id: string
}

/**
 * The address that opens an item: its page, or for a kind without a page (`isNavigable`) the
 * document of its artifact at the item, which the page scrolls to and marks. While the kinds have
 * not loaded, the item page: most kinds have one.
 */
export function useItemHref(projectId: string): (item: AddressedItem) => Route {
  const project = routes.project(projectId)
  const { data: kinds } = useArtifactKinds()
  const schemas = useMemo(() => contentSchemasByKind(kinds), [kinds])
  return useCallback(
    (item) => {
      const schema = schemas.get(item.kind)
      return schema !== undefined && !isNavigable(schema)
        ? project.document(item.artifact_id, { itemId: item.id })
        : project.item(item.id)
    },
    [project, schemas],
  )
}
