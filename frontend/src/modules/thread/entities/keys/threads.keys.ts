import type { ThreadFilters } from '../types/threads.types'

/** The query keys of the threads, from the widest to the narrowest; each starts with the one above. */
export const threadKeys = {
  all: () => ['threads'] as const,
  /** The start of the key of every list of threads, to load them all again after a change. */
  lists: () => [...threadKeys.all(), 'list'] as const,
  /** The threads of one project. */
  ofProject: (projectId: string) => [...threadKeys.lists(), 'project', projectId] as const,
  /** The threads of the user, narrowed by the filters. */
  list: (filters: ThreadFilters) => [...threadKeys.lists(), 'user', filters] as const,
  /** One thread. */
  detail: (threadId: string) => [...threadKeys.all(), 'detail', threadId] as const,
}
