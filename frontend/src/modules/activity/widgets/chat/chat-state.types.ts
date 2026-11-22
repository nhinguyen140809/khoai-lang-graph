/** What the body of the chat shows: no thread to read, the load, its failure, or the messages. */
export type ChatState = 'empty' | 'pending' | 'error' | 'ready'

/** What the chat knows of its load: the thread, its queries and whether anything was said. */
export interface ChatLoad {
  hasThread: boolean
  isPending: boolean
  isError: boolean
  hasActivity: boolean
}

/** What the chat knows of the runs before the ones it shows: whether there are more, whether they load or failed to, and how to load them. */
export interface OlderRuns {
  hasMore: boolean
  isLoading: boolean
  isError: boolean
  load: () => void
}
