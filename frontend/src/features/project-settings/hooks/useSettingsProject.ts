import { useQuery } from '@tanstack/react-query'

import { isNotFoundError } from '@/shared/api/api-fetch.utils'

import { getSettingsProject } from '../project-settings.api'

export function useSettingsProject(projectId: string) {
  return useQuery({
    queryKey: ['project-settings', 'project', projectId],
    queryFn: () => getSettingsProject(projectId),
    retry: (failureCount, error) => !isNotFoundError(error) && failureCount < 1,
  })
}
