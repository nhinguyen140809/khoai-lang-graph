import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { HookQueryOptions } from '@/shared/api/query-client'

import { workflowDefinitionStaleTime } from '../../definition/stale-time.constants'
import { getArtifactKinds, getContentSchema } from '../artifact-kinds.api'
import { artifactKindKeys } from '../artifact-kinds.keys'
import type { ContentSchema } from '../artifact-kinds.types'
import { contentSchemasByKind } from '../kind-schemas.utils'

/**
 * The content schemas of every kind in a workflow version, or in the current one without a
 * version. A version never changes once a run has used it, so it is read once.
 */
export function useArtifactKinds(workflowVersion?: number) {
  return useQuery({
    queryKey: artifactKindKeys.list(workflowVersion),
    queryFn: () => getArtifactKinds(workflowVersion),
    staleTime: workflowVersion === undefined ? workflowDefinitionStaleTime : Infinity,
  })
}

/** The content schema of a kind at one version; a version never changes, so it is read once. */
export function useContentSchema(
  kind: string,
  version: number,
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useQuery({
    queryKey: artifactKindKeys.schema(kind, version),
    queryFn: () => getContentSchema(kind, version),
    enabled: isEnabled,
    staleTime: Infinity,
  })
}

/**
 * The schema of the content of every kind, by kind, built once from the kinds that loaded: what
 * the title, the display or the address of an item reads. Empty until the kinds load.
 */
export function useContentSchemas(): ReadonlyMap<string, ContentSchema> {
  const { data: kinds } = useArtifactKinds()
  return useMemo(() => contentSchemasByKind(kinds), [kinds])
}
