/** The query keys of the runs, from the widest to the narrowest; each starts with the one above. */
export const runKeys = {
  all: () => ['runs'] as const,
  latestRun: (threadId: string) => [...runKeys.all(), 'latest', threadId] as const,
}
