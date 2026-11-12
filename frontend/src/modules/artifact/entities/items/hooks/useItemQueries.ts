import { useInfiniteQuery, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import {
  type ContentSchema,
  kindSchemasByKind,
  useArtifactKinds,
  useContentSchema,
} from '@/modules/workflow/entities/@x/artifact'
import { cursorPagesOptions, type HookQueryOptions } from '@/shared/api/query-client'

import { getItem, listArtifactItems, listProjectItems } from '../items.api'
import { itemsPageSize, outlinePageSize, prefetchStaleMs } from '../items.constants'
import { itemKeys } from '../items.keys'
import type { ArtifactItem, ArtifactItemFilters, ProjectItemFilters } from '../items.types'

const itemsOfEachKind = (results: readonly { data: { items: ArtifactItem[] } | undefined }[]) =>
  results.map(({ data }) => data?.items ?? [])

/**
 * The items of an artifact in outline order, narrowed by the filters, a page at a time; `isEnabled`
 * waits until they are needed.
 */
export function useArtifactItems(
  artifactId: string,
  filters: ArtifactItemFilters = {},
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useInfiniteQuery({
    queryKey: itemKeys.ofArtifact(artifactId, filters),
    queryFn: ({ pageParam }) => listArtifactItems(artifactId, pageParam, outlinePageSize, filters),
    ...cursorPagesOptions,
    enabled: isEnabled,
  })
}

/** The items of a project, narrowed by the filters, ordered by key, a page at a time. */
export function useProjectItems(
  projectId: string,
  filters: ProjectItemFilters = {},
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useInfiniteQuery({
    queryKey: itemKeys.ofProject(projectId, filters),
    queryFn: ({ pageParam }) => listProjectItems(projectId, pageParam, itemsPageSize, filters),
    ...cursorPagesOptions,
    enabled: isEnabled,
  })
}

/**
 * The first page of the items of each kind given, in the order of the kinds, an empty list for a
 * kind not loaded yet; `isEnabled` waits until they are needed.
 */
export function useProjectItemsOfKinds(
  projectId: string,
  kinds: readonly string[],
  { isEnabled = true }: HookQueryOptions = {},
): ArtifactItem[][] {
  return useQueries({
    queries: kinds.map((kind) => ({
      queryKey: itemKeys.firstOfProject(projectId, { kind }),
      queryFn: () => listProjectItems(projectId, null, itemsPageSize, { kind }),
      enabled: isEnabled,
    })),
    combine: itemsOfEachKind,
  })
}

/** One item; with `version`, the item as it was at that version. */
export function useItem(
  itemId: string,
  version?: number,
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useQuery({
    queryKey: itemKeys.detail(itemId, version),
    queryFn: () => getItem(itemId, version),
    enabled: isEnabled,
  })
}

/**
 * Loads an item ahead of time, so that the page of the item opens with its content already
 * there. An item that is already loaded is not asked for again.
 */
export function usePrefetchItem() {
  const queryClient = useQueryClient()
  return useCallback(
    (itemId: string) => {
      // A failure here is not shown: the page asks again when the item is opened.
      queryClient
        .query({
          queryKey: itemKeys.detail(itemId),
          queryFn: () => getItem(itemId),
          staleTime: prefetchStaleMs,
        })
        .catch(() => undefined)
    },
    [queryClient],
  )
}

/**
 * The content schema that an item follows: the current one of its kind when the item was written
 * with it, else the schema of the version it was written with. `isPending` holds while there is
 * neither a schema nor a failure; `retry` asks for it again.
 */
export function useItemSchema(item: Pick<ArtifactItem, 'kind' | 'schema_version'> | undefined): {
  schema: ContentSchema | undefined
  isPending: boolean
  isError: boolean
  retry: () => void
} {
  const kinds = useArtifactKinds()
  const kindSchemas = useMemo(() => kindSchemasByKind(kinds.data), [kinds.data])
  const current = kindSchemas.get(item?.kind ?? '')
  const hasSameVersion = current !== undefined && current.schema_version === item?.schema_version
  const older = useContentSchema(item?.kind ?? '', item?.schema_version ?? 0, {
    isEnabled: item !== undefined && kinds.isSuccess && !hasSameVersion,
  })
  const retry = () => {
    void kinds.refetch()
    void older.refetch()
  }
  if (hasSameVersion) return { schema: current.schema, isPending: false, isError: false, retry }
  const isError = kinds.isError || older.isError
  return { schema: older.data, isPending: older.data === undefined && !isError, isError, retry }
}
