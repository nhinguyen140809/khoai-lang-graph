import { useQuery } from '@tanstack/react-query'

import { getTraceabilityCoverage, getTraceabilityMatrix } from '../traceability.api'
import { traceabilityKeys } from '../traceability.keys'

/** The matrix of the chains of a project. */
export function useTraceabilityMatrix(projectId: string) {
  return useQuery({
    queryKey: traceabilityKeys.matrix(projectId),
    queryFn: () => getTraceabilityMatrix(projectId),
  })
}

/** The items of a project that need attention. */
export function useTraceabilityCoverage(projectId: string) {
  return useQuery({
    queryKey: traceabilityKeys.coverage(projectId),
    queryFn: () => getTraceabilityCoverage(projectId),
  })
}
