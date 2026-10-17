import type { ProjectFilters, ProjectStatus } from './projects.types'

/**
 * The query keys of the projects, from the widest to the narrowest; each starts with the one above.
 * `create` is the key of the mutation that creates a project, for the components that wait for it.
 */
export const projectKeys = {
  all: () => ['projects'] as const,
  /** The start of the key of every list of projects, to load them all again after a change. */
  lists: () => [...projectKeys.all(), 'list'] as const,
  /** One list: the projects with one status, narrowed by the filters. */
  list: (status: ProjectStatus, filters: ProjectFilters) =>
    [...projectKeys.lists(), status, filters] as const,
  /** The recent projects that the menus offer. */
  recent: () => [...projectKeys.lists(), 'recent'] as const,
  detail: (projectId: string) => [...projectKeys.all(), 'detail', projectId] as const,
  create: () => [...projectKeys.all(), 'create'] as const,
}
