import { useQuery } from '@tanstack/react-query'

import { listProjectThreads } from '../threads.api'

export function useProjectThreads(projectId: string) {
  return useQuery({
    queryKey: ['threads', 'project', projectId],
    queryFn: () => listProjectThreads(projectId),
  })
}
