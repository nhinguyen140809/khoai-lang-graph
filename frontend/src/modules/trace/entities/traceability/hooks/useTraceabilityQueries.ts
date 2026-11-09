import { useQuery } from '@tanstack/react-query'

import type { LiveTraceOptions } from '../../live-trace.types'
import { getTraceabilityCoverage, getTraceabilityMatrix } from '../traceability.api'
import { traceabilityKeys } from '../traceability.keys'

/** The matrix of the chains of a project. */
export function useTraceabilityMatrix(projectId: string) {
  return useQuery({
    queryKey: traceabilityKeys.matrix(projectId),
    queryFn: () => getTraceabilityMatrix(projectId),
  })
}

/** The items of a project that need attention; a reload follows the agents while they write. */
export function useTraceabilityCoverage(
  projectId: string,
  { refetchInterval }: LiveTraceOptions = {},
) {
  return useQuery({
    queryKey: traceabilityKeys.coverage(projectId),
    queryFn: () => getTraceabilityCoverage(projectId),
    refetchInterval: refetchInterval ?? false,
  })
}
