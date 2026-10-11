import { useQuery } from '@tanstack/react-query'

import { listProjectTreeItems } from '../artifacts.api'

/** Every item of the project, each carrying the artifact it belongs to. */
export function useProjectTreeItems(projectId: string) {
  return useQuery({
    queryKey: ['artifacts', 'tree-items', projectId],
    queryFn: () => listProjectTreeItems(projectId),
  })
}
