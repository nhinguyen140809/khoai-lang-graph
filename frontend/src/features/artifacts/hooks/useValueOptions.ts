import { useProjectArtifacts } from './useProjectArtifacts'

/**
 * The values that a field may take when its schema says `x-value-from`, such as
 * `elicitation_plan.topics`: the entries of that field of that artifact of the project.
 */
export function useValueOptions(projectId: string, valueFrom: string | null): string[] {
  const artifacts = useProjectArtifacts(projectId)
  if (valueFrom === null) return []
  const [kind, field] = valueFrom.split('.')
  const source = artifacts.data?.find((artifact) => artifact.kind === kind)
  const values = field === undefined ? undefined : source?.content[field]
  return Array.isArray(values)
    ? values.filter((value): value is string => typeof value === 'string')
    : []
}
