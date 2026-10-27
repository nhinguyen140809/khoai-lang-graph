import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  type ContentSchema,
  kindSchemasByKind,
  useArtifactKinds,
  useContentSchema,
} from '@/modules/workflow/entities/@x/artifact'
import { cursorPagesOptions } from '@/shared/api/query-client'

import { getItem, listArtifactItems, listItemRevisions, listProjectItems } from '../api/items.api'
import { itemKeys } from '../keys/items.keys'
import { itemsPageSize, outlinePageSize, revisionsPageSize } from '../page-sizes.constants'
import type { ArtifactItem, ArtifactItemFilters, ProjectItemFilters } from '../types/items.types'

/**
 * The items of an artifact in outline order, narrowed by the filters, a page at a time; `enabled`
 * waits until they are needed.
 */
export function useArtifactItems(
  artifactId: string,
  filters: ArtifactItemFilters = {},
  isEnabled = true,
) {
  return useInfiniteQuery({
    queryKey: itemKeys.ofArtifact(artifactId, filters),
    queryFn: ({ pageParam }) => listArtifactItems(artifactId, pageParam, outlinePageSize, filters),
    ...cursorPagesOptions,
    enabled: isEnabled,
  })
}

/** The items of a project, narrowed by the filters, ordered by key, a page at a time. */
export function useProjectItems(projectId: string, filters: ProjectItemFilters = {}) {
  return useInfiniteQuery({
    queryKey: itemKeys.ofProject(projectId, filters),
    queryFn: ({ pageParam }) => listProjectItems(projectId, pageParam, itemsPageSize, filters),
    ...cursorPagesOptions,
  })
}

/** One item; with `version`, the item as it was at that version. */
export function useItem(itemId: string, version?: number) {
  return useQuery({
    queryKey: itemKeys.detail(itemId, version),
    queryFn: () => getItem(itemId, version),
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
 * The content schema that an item follows: the current one of its kind when the item was written
 * with it, else the schema of the version it was written with. `isPending` holds while there is
 * neither a schema nor a failure.
 */
export function useItemSchema(item: ArtifactItem | undefined): {
  schema: ContentSchema | undefined
  isPending: boolean
  isError: boolean
} {
  const kinds = useArtifactKinds()
  const kindSchemas = useMemo(() => kindSchemasByKind(kinds.data), [kinds.data])
  const current = kindSchemas.get(item?.kind ?? '')
  const hasSameVersion = current !== undefined && current.schema_version === item?.schema_version
  const older = useContentSchema(
    item?.kind ?? '',
    item?.schema_version ?? 0,
    item !== undefined && kinds.isSuccess && !hasSameVersion,
  )
  if (hasSameVersion) return { schema: current.schema, isPending: false, isError: false }
  const isError = kinds.isError || older.isError
  return { schema: older.data, isPending: older.data === undefined && !isError, isError }
}
