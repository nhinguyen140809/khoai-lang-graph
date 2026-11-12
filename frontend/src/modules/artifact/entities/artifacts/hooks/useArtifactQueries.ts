import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { ContentField } from '@/modules/workflow/entities/@x/artifact'
import type { HookQueryOptions } from '@/shared/api/query-client'

import { allowedValues } from '../allowed-values.utils'
import { getArtifact, listProjectArtifacts } from '../artifacts.api'
import { artifactKeys } from '../artifacts.keys'
import type { ArtifactFilters } from '../artifacts.types'

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
export function useArtifact(
  artifactId: string,
  version?: number,
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useQuery({
    queryKey: artifactKeys.detail(artifactId, version),
    queryFn: () => getArtifact(artifactId, version),
    enabled: isEnabled,
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

/**
 * The values that each field with `x-value-from` may take, by field name, from one read of the
 * artifacts of the project: what a form of the whole content offers to each of its selects.
 */
export function useAllowedValuesOf(
  projectId: string,
  fields: readonly ContentField[],
): ReadonlyMap<string, string[]> {
  const artifacts = useProjectArtifacts(projectId)
  return useMemo(() => {
    const byField = new Map<string, string[]>()
    for (const field of fields) {
      if (field.allowedValuesFrom !== null) {
        byField.set(field.name, allowedValues(artifacts.data, field.allowedValuesFrom))
      }
    }
    return byField
  }, [fields, artifacts.data])
}
