/** The query keys of the console, from the widest to the narrowest. */
export const consoleKeys = {
  messages: (threadId: string) => ['console', 'messages', threadId] as const,
  runs: (threadId: string) => ['console', 'runs', threadId] as const,
  steps: (runId: string) => ['console', 'steps', runId] as const,
  review: (runId: string) => ['console', 'review', runId] as const,
}

/** Matches every query that the console shows and that a run changes. */
export const eventLogKeyRoots = [
  ['console', 'messages'],
  ['console', 'runs'],
  ['console', 'steps'],
  ['console', 'review'],
] as const
