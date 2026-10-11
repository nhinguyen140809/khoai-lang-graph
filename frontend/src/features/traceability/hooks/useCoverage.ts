import { useQuery } from '@tanstack/react-query'

import { getCoverage } from '../traceability.api'

export function useCoverage(projectId: string) {
  return useQuery({
    queryKey: ['traceability', 'coverage', projectId],
    queryFn: () => getCoverage(projectId),
  })
}
