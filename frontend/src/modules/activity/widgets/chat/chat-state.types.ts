/** What the body of the chat shows: no thread to read, the load, its failure, or the messages. */
export type ChatState = 'empty' | 'pending' | 'error' | 'ready'

/** What the chat knows of its load: the thread, its queries and whether anything was said. */
export interface ChatLoad {
  hasThread: boolean
  isPending: boolean
  isError: boolean
  hasActivity: boolean
}
