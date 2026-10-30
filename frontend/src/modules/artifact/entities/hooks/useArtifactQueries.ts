import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { cursorPagesOptions, type HookQueryOptions } from '@/shared/api/query-client'

import { getArtifact, listArtifactRevisions, listProjectArtifacts } from '../api/artifacts.api'
import { revisionsPageSize } from '../constants/page-sizes.constants'
import { artifactKeys } from '../keys/artifacts.keys'
import type { ArtifactFilters } from '../types/artifacts.types'
import { allowedValues } from '../utils/allowed-values.utils'

/** The artifacts of a project, narrowed by the filters, in the order of the stages that make them. */
export function useProjectArtifacts(
  projectId: string,
  filters: ArtifactFilters = {},
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useQuery({
    queryKey: artifactKeys.list(projectId, filters),
    queryFn: () => listProjectArtifacts(projectId, filters),
    enabled: isEnabled,
  })
}

/** One artifact; with `version`, the artifact as it was at that version. */
export function useArtifact(artifactId: string, version?: number) {
  return useQuery({
    queryKey: artifactKeys.detail(artifactId, version),
    queryFn: () => getArtifact(artifactId, version),
  })
}

/** The versions of an artifact, newest first, a page at a time. */
export function useArtifactRevisions(artifactId: string) {
  return useInfiniteQuery({
    queryKey: artifactKeys.revisions(artifactId),
    queryFn: ({ pageParam }) => listArtifactRevisions(artifactId, pageParam, revisionsPageSize),
    ...cursorPagesOptions,
  })
}

/**
 * The values that a field may take when its schema says `x-value-from`: the entries of a field of
 * an artifact of the project. The list is the same one until the artifacts or the source change.
 */
export function useAllowedValues(projectId: string, allowedValuesFrom: string | null): string[] {
  const artifacts = useProjectArtifacts(
    projectId,
    {},
    {
      isEnabled: allowedValuesFrom !== null,
    },
  )
  return useMemo(
    () => allowedValues(artifacts.data, allowedValuesFrom),
    [artifacts.data, allowedValuesFrom],
  )
}
