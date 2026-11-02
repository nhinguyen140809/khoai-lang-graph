import { useInfiniteQuery } from '@tanstack/react-query'

import { cursorPagesOptions } from '@/shared/api/query-client'

import { artifactKeys } from '../../artifacts/artifacts.keys'
import { itemKeys } from '../../items/items.keys'
import { listArtifactRevisions, listItemRevisions } from '../revisions.api'
import { revisionsPageSize } from '../revisions.constants'

/** The versions of an artifact, newest first, a page at a time. */
export function useArtifactRevisions(artifactId: string) {
  return useInfiniteQuery({
    queryKey: artifactKeys.revisions(artifactId),
    queryFn: ({ pageParam }) => listArtifactRevisions(artifactId, pageParam, revisionsPageSize),
    ...cursorPagesOptions,
  })
}

/** The versions of an item, newest first, a page at a time. */
export function useItemRevisions(itemId: string) {
  return useInfiniteQuery({
    queryKey: itemKeys.revisions(itemId),
    queryFn: ({ pageParam }) => listItemRevisions(itemId, pageParam, revisionsPageSize),
    ...cursorPagesOptions,
  })
}
