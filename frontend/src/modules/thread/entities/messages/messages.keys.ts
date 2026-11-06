/** The query keys of the messages, from the widest to the narrowest. */
export const messageKeys = {
  all: () => ['messages'] as const,
  /** The messages of one thread. */
  ofThread: (threadId: string) => [...messageKeys.all(), threadId] as const,
}
