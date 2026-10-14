import { useQuery } from '@tanstack/react-query'

import { getDefinitionSummary } from '../artifacts.api'
import { artifactKeys } from '../artifacts.keys'

/** The export templates and the link types; they change only with the workflow definition. */
export function useDefinitionSummary() {
  return useQuery({
    queryKey: artifactKeys.definition(),
    queryFn: getDefinitionSummary,
    staleTime: 10 * 60_000,
  })
}
