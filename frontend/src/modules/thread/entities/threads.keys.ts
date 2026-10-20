/** The query keys of the threads, from the widest to the narrowest; each starts with the one above. */
export const threadKeys = {
  all: () => ['threads'] as const,
  ofProject: (projectId: string) => [...threadKeys.all(), 'project', projectId] as const,
}
