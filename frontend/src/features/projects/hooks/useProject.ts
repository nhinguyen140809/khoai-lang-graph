import { useQuery } from '@tanstack/react-query'

import { isNotFoundError } from '@/shared/api/api-error.utils'

import { getProject } from '../projects.api'

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', 'detail', projectId],
    queryFn: () => getProject(projectId),
    // A project that does not exist will not appear on a second try.
    retry: (failureCount, error) => !isNotFoundError(error) && failureCount < 1,
  })
}
