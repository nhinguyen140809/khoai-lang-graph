'use client'

import { type ProjectFilters, useRecentProjects } from '@/modules/project/entities'

import { sidebarProjectCount } from '../project-sidebar.constants'
import { projectsByAttention } from '../project-sidebar.utils'

/**
 * The projects that the side list shows without a search: the active ones with the latest
 * activity that the filters keep, as many as `sidebarProjectCount`, from the one that needs the user most. `shown` is
 * undefined until they load, or when they failed to.
 */
export function useRecentSidebarProjects(filters: ProjectFilters) {
  const projects = useRecentProjects(sidebarProjectCount, filters)

  return {
    isPending: projects.isPending,
    shown: projects.data === undefined ? undefined : projectsByAttention(projects.data),
    retry: () => void projects.refetch(),
  }
}
