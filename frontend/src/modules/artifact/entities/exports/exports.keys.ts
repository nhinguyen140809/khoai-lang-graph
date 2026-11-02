/** The query keys of exports, from the widest to the narrowest. */
export const exportKeys = {
  all: () => ['exports'] as const,
  lists: () => [...exportKeys.all(), 'list'] as const,
  list: (projectId: string) => [...exportKeys.lists(), projectId] as const,
  detail: (exportId: string) => [...exportKeys.all(), 'detail', exportId] as const,
}
