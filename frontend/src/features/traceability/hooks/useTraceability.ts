import { useQuery } from '@tanstack/react-query'

import { getCoverage, getMatrix, listProjectItems } from '../traceability.api'

/** The matrix rows, the coverage lists and the items of the project. */
export function useProjectTrace(projectId: string) {
  const matrix = useQuery({
    queryKey: ['traceability', 'matrix', projectId],
    queryFn: () => getMatrix(projectId),
  })
  const coverage = useQuery({
    queryKey: ['traceability', 'coverage', projectId],
    queryFn: () => getCoverage(projectId),
  })
  const items = useQuery({
    queryKey: ['traceability', 'items', projectId],
    queryFn: () => listProjectItems(projectId),
  })
  return { matrix, coverage, items }
}
