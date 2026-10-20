import type { Message } from '@/modules/thread/entities'

export interface ActivityTurn {
  id: string
  prompt: string
  runId: string
}

/**
 * Who an entry of the activity comes from, as the author of a message: the user, the agents, or
 * the app, such as for a run that stopped.
 */
export type EntryAuthor = Message['author']
