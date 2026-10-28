import { useQuery } from '@tanstack/react-query'

import type { HookQueryOptions } from '@/shared/api/query-client'

import { getArtifactTrace, getItemTrace } from '../api/chains.api'
import { chainKeys } from '../keys/chains.keys'
import type { TraceQuery } from '../types/chains.types'

/** The chain of one item; `isEnabled` waits until it is needed. */
export function useItemTrace(
  itemId: string,
  query: TraceQuery = {},
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useQuery({
    queryKey: chainKeys.ofItem(itemId, query),
    queryFn: () => getItemTrace(itemId, query),
    enabled: isEnabled,
  })
}

/** The chains of all the items of an artifact; `isEnabled` waits until it is needed. */
export function useArtifactTrace(
  artifactId: string,
  query: TraceQuery = {},
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useQuery({
    queryKey: chainKeys.ofArtifact(artifactId, query),
    queryFn: () => getArtifactTrace(artifactId, query),
    enabled: isEnabled,
  })
}
