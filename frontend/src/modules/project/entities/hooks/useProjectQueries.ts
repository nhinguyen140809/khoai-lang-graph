import {
  type InfiniteData,
  type QueryClient,
  skipToken,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { cursorPagesOptions } from '@/shared/api/query-client'
import { type ListPage } from '@/shared/api/request'

import { getProject, listProjects } from '../projects.api'
import { projectKeys } from '../projects.keys'
import type { Project, ProjectFilters, ProjectStatus } from '../projects.types'

// How many projects a page of the list holds; the next page loads on demand.
const PAGE_SIZE = 50

// How many projects the menus offer to open, so that they stay short; the project list has the
// others.
const RECENT_COUNT = 5

// A project that a list of projects has loaded, or undefined. The lists are the pages of the
// project list and the recent projects of the menus.
function listedProject(queryClient: QueryClient, projectId: string): Project | undefined {
  for (const query of queryClient.getQueryCache().findAll({ queryKey: projectKeys.lists() })) {
    const data = query.state.data as InfiniteData<ListPage<Project>> | Project[] | undefined
    const projects = Array.isArray(data) ? data : (data?.pages.flatMap(({ items }) => items) ?? [])
    const project = projects.find(({ id }) => id === projectId)
    if (project !== undefined) return project
  }
  return undefined
}

/**
 * One project; a project that does not exist fails at once, as every answer below 500 does. Idle
 * until a project is given, such as outside a project. A project that a list has loaded shows at
 * once, such as in a dialog opened from its row, and loads again at once: a project deleted since
 * then fails, and its address shows it as not found.
 */
export function useProject(projectId: string | undefined) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: projectId === undefined ? skipToken : () => getProject(projectId),
    initialData: () =>
      projectId === undefined ? undefined : listedProject(queryClient, projectId),
    initialDataUpdatedAt: 0,
  })
}

/**
 * The projects of the user with one status, narrowed by the filters, the latest activity first, a
 * page at a time.
 */
export function useProjectList(status: ProjectStatus, filters: ProjectFilters) {
  return useInfiniteQuery({
    queryKey: projectKeys.list(status, filters),
    queryFn: ({ pageParam }) => listProjects(status, pageParam, PAGE_SIZE, filters),
    ...cursorPagesOptions,
  })
}

/** The active projects with the latest activity, for the menus that open a project. */
export function useRecentProjects() {
  return useQuery({
    queryKey: projectKeys.recent(),
    queryFn: async () => (await listProjects('active', null, RECENT_COUNT)).items,
  })
}
