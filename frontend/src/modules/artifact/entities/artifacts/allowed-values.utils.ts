import { isString } from '@/shared/lib/guards'

import type { Artifact } from './artifacts.types'

/**
 * The values that a field may take when its schema says `x-value-from`, such as
 * `elicitation_plan.topics`: the entries of that field of that artifact of the project. A field
 * without `x-value-from`, an artifact not made yet and a field that is not a list have none.
 */
export function allowedValues(
  artifacts: Artifact[] | undefined,
  allowedValuesFrom: string | null,
): string[] {
  if (allowedValuesFrom === null) return []
  const [kind, field] = allowedValuesFrom.split('.')
  const source = artifacts?.find((artifact) => artifact.kind === kind)
  const values = field === undefined ? undefined : source?.content[field]
  return Array.isArray(values) ? values.filter(isString) : []
}
