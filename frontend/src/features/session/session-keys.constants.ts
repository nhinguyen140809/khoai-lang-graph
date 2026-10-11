/** The query keys of the session, from the widest to the narrowest. */
export const sessionKeys = {
  messages: (threadId: string) => ['session', 'messages', threadId] as const,
  runs: (threadId: string) => ['session', 'runs', threadId] as const,
  steps: (runId: string) => ['session', 'steps', runId] as const,
  review: (runId: string) => ['session', 'review', runId] as const,
}

/** Matches every query that the session shows and that a run changes. */
export const eventLogKeyRoots = [
  ['session', 'messages'],
  ['session', 'runs'],
  ['session', 'steps'],
  ['session', 'review'],
] as const
