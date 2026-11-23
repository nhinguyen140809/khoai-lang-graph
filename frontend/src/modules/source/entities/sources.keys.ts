/** The query keys of the sources of a project, from the widest to the narrowest. */
export const sourceKeys = {
  all: () => ['sources'] as const,
  lists: () => [...sourceKeys.all(), 'list'] as const,
  list: (projectId: string) => [...sourceKeys.lists(), projectId] as const,
  detail: (sourceId: string) => [...sourceKeys.all(), 'detail', sourceId] as const,
  /** The mutation that uploads a source, so that a screen knows while one goes up. */
  upload: () => [...sourceKeys.all(), 'upload'] as const,
}
