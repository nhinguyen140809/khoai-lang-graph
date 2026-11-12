import { useEffect, useMemo } from 'react'

import { useArtifactItemKinds, useArtifactKinds } from '@/modules/workflow/entities/@x/artifact'
import { pageItems } from '@/shared/api/query-client'

import { reviewStatus } from '../../artifacts/artifacts.types'
import { useArtifact } from '../../artifacts/hooks/useArtifactQueries'
import { useArtifactItems } from '../../items/hooks/useItemQueries'
import type { OutlineItemsResult } from '../outline.types'
import { useKindViews } from './useKindViews'

/**
 * The items of an artifact in outline order without the superseded ones, every page loaded, with
 * the kinds that draw them. With no artifact it loads nothing and stays pending. Loads the next page as long as there is one.
 */
export function useOutlineItems(artifactId: string | undefined): OutlineItemsResult {
  const isEnabled = artifactId !== undefined
  const artifact = useArtifact(artifactId ?? '', undefined, { isEnabled })
  const items = useArtifactItems(artifactId ?? '', {}, { isEnabled })
  const kinds = useArtifactKinds()
  const itemKindsByKind = useArtifactItemKinds()
  const kindViews = useKindViews()
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = items

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])

  const outlineItems = useMemo(
    () => pageItems(items.data).filter((item) => item.review_status !== reviewStatus.superseded),
    [items.data],
  )

  const artifactKind = artifact.data?.kind
  const itemKinds = useMemo(
    () => (artifactKind === undefined ? [] : (itemKindsByKind.data?.get(artifactKind) ?? [])),
    [itemKindsByKind.data, artifactKind],
  )
  const isReady =
    artifact.data !== undefined &&
    items.data !== undefined &&
    kindViews !== undefined &&
    itemKindsByKind.data !== undefined &&
    !hasNextPage
  // One result for the same data, so that what reads it computes again only when the data changes.
  const success = useMemo<OutlineItemsResult | undefined>(
    () =>
      kindViews === undefined
        ? undefined
        : { state: 'success', items: outlineItems, itemKinds, kinds: kindViews },
    [outlineItems, itemKinds, kindViews],
  )

  const isError = artifact.isError || items.isError || kinds.isError || itemKindsByKind.isError
  if (isError) {
    return {
      state: 'error',
      retry: () => {
        void artifact.refetch()
        void items.refetch()
        void kinds.refetch()
        void itemKindsByKind.refetch()
      },
    }
  }
  return isReady && success !== undefined ? success : { state: 'pending' }
}
