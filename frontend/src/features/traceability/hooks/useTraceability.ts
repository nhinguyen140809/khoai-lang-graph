import { useQuery } from '@tanstack/react-query'

import { listProjectItems, listProjectLinks } from '../traceability.api'

/** The links and the items of the project, the two halves of the matrix. */
export function useProjectTrace(projectId: string) {
  const links = useQuery({
    queryKey: ['traceability', 'links', projectId],
    queryFn: () => listProjectLinks(projectId),
  })
  const items = useQuery({
    queryKey: ['traceability', 'items', projectId],
    queryFn: () => listProjectItems(projectId),
  })
  return { links, items }
}
