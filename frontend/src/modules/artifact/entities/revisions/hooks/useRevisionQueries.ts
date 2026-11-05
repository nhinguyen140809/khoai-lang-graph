import { useInfiniteQuery } from '@tanstack/react-query'

import { cursorPagesOptions } from '@/shared/api/query-client'

import { artifactKeys } from '../../artifacts/artifacts.keys'
import { itemKeys } from '../../items/items.keys'
import { listArtifactRevisions, listItemRevisions } from '../revisions.api'
import { revisionsPageSize } from '../revisions.constants'
import type { RevisionHistoryResult, RevisionTarget } from '../revisions.types'

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

/**
 * The versions of a record, item or artifact, newest first, a page at a time; `isEnabled` waits
 * until they are shown. One hook for both, so that a page never calls two hooks by condition.
 */
export function useRevisionHistory(
  target: RevisionTarget,
  { isEnabled }: { isEnabled: boolean },
): RevisionHistoryResult {
  const isItem = target.type === 'item'
  const query = useInfiniteQuery({
    queryKey: isItem ? itemKeys.revisions(target.id) : artifactKeys.revisions(target.id),
    queryFn: ({ pageParam }) =>
      isItem
        ? listItemRevisions(target.id, pageParam, revisionsPageSize)
        : listArtifactRevisions(target.id, pageParam, revisionsPageSize),
    enabled: isEnabled,
    ...cursorPagesOptions,
  })
  if (query.isError) return { state: 'error', retry: () => void query.refetch() }
  if (query.data === undefined) return { state: 'pending' }
  const pages = query.data.pages
  return {
    state: 'success',
    revisions: pages.flatMap(({ items }) => items),
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: async () => {
      await query.fetchNextPage()
    },
  }
}
