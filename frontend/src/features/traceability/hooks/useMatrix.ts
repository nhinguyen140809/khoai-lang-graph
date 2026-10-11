import { useQuery } from '@tanstack/react-query'

import { getMatrix } from '../traceability.api'

export function useMatrix(projectId: string) {
  return useQuery({
    queryKey: ['traceability', 'matrix', projectId],
    queryFn: () => getMatrix(projectId),
  })
}
