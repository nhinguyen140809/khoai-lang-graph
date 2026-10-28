import { useQuery } from '@tanstack/react-query'

import type { HookQueryOptions } from '@/shared/api/query-client'

import { getArtifactKinds, getContentSchema } from '../api/artifact-kinds.api'
import { artifactKindKeys } from '../keys/artifact-kinds.keys'
import { workflowDefinitionStaleTime } from '../stale-time.constants'

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
