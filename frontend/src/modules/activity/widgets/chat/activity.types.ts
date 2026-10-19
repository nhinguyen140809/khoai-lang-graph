export interface ActivityTurn {
  id: string
  prompt: string
  runId: string
}

/** Who an entry of the activity comes from: the user, the agents, or the app, such as for a run that stopped. */
export type EntryAuthor = 'user' | 'agent' | 'system'
