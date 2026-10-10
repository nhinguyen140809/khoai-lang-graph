import { useQuery } from '@tanstack/react-query'

import { listProjects } from '../projects.api'
import type { ProjectStatus } from '../projects.types'

export const projectsQueryKey = ['projects', 'list'] as const

/** The projects of the user with one status, ordered by last activity, newest first. */
export function useProjects(status: ProjectStatus) {
  return useQuery({
    queryKey: [...projectsQueryKey, status],
    queryFn: () => listProjects(status),
  })
}
