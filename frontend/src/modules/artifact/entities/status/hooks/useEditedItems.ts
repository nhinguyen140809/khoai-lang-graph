'use client'

import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'

import { listArtifactItems } from '../../items/items.api'
import { outlinePageSize } from '../../items/items.constants'
import { itemKeys } from '../../items/items.keys'
import type { ArtifactItem } from '../../items/items.types'
import { editedItems } from '../item-status.utils'

/**
 * The edited items of the artifacts given, from the first page of the items of each: what a review
 * sends as the items the user changed before answering it.
 */
export function useEditedItems(artifactIds: readonly string[]): ArtifactItem[] {
  const pages = useQueries({
    queries: artifactIds.map((artifactId) => ({
      queryKey: itemKeys.firstOfArtifact(artifactId),
      queryFn: () => listArtifactItems(artifactId, null, outlinePageSize),
    })),
  })
  return useMemo(() => editedItems(pages.flatMap(({ data }) => data?.items ?? [])), [pages])
}
