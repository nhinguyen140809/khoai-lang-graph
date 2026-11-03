import { useEffect, useMemo } from 'react'

import {
  contentDisplayOf,
  kindSchemasByKind,
  useArtifactKinds,
  useWorkflowDefinition,
} from '@/modules/workflow/entities/@x/artifact'
import { pageItems } from '@/shared/api/query-client'

import { reviewStatus } from '../../artifacts/artifacts.types'
import { useArtifact } from '../../artifacts/hooks/useArtifactQueries'
import { useArtifactItems } from '../../items/hooks/useItemQueries'
import type { KindView, OutlineItemsResult } from '../outline.types'

/**
 * The items of an artifact in outline order without the superseded ones, every page loaded, with
 * the kinds that draw them. Loads the next page as long as there is one.
 */
export function useOutlineItems(artifactId: string): OutlineItemsResult {
  const artifact = useArtifact(artifactId)
  const items = useArtifactItems(artifactId)
  const kinds = useArtifactKinds()
  const definition = useWorkflowDefinition()
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = items

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])

  const kindViews = useMemo(() => {
    const views = new Map<string, KindView>()
    for (const [kind, { schema }] of kindSchemasByKind(kinds.data)) {
      views.set(kind, { title: schema.title, display: contentDisplayOf(schema), schema })
    }
    return views
  }, [kinds.data])

  const outlineItems = useMemo(
    () => pageItems(items.data).filter((item) => item.review_status !== reviewStatus.superseded),
    [items.data],
  )

  const itemKinds = useMemo(
    () =>
      definition.data?.artifact_kinds.find(({ kind }) => kind === artifact.data?.kind)
        ?.item_kinds ?? [],
    [definition.data, artifact.data?.kind],
  )
  const isReady =
    artifact.data !== undefined &&
    items.data !== undefined &&
    kinds.data !== undefined &&
    definition.data !== undefined &&
    !hasNextPage
  // One result for the same data, so that what reads it computes again only when the data changes.
  const success = useMemo<OutlineItemsResult>(
    () => ({ state: 'success', items: outlineItems, itemKinds, kinds: kindViews }),
    [outlineItems, itemKinds, kindViews],
  )

  const isError = artifact.isError || items.isError || kinds.isError || definition.isError
  if (isError) {
    return {
      state: 'error',
      retry: () => {
        void artifact.refetch()
        void items.refetch()
        void kinds.refetch()
        void definition.refetch()
      },
    }
  }
  return isReady ? success : { state: 'pending' }
}
