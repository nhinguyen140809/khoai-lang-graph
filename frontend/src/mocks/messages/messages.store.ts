import { mockState } from '../shared/db/mock-state.utils'

/**
 * A message as POST /threads/{thread_id}/messages answers it, since the threads feature has no type
 * of a message yet.
 */
export interface SentMessage {
  id: string
  thread_id: string
  /** Order of the message in its thread, from 1, without gaps. */
  sequence: number
  /** The run that the message started or belongs to. */
  run_id: string | null
  author: 'user' | 'agent' | 'system'
  agent_role: string | null
  content: string
  artifact_refs: { artifact_id: string; kind: string; title: string; version: number }[]
  item_refs: { item_id: string; kind: string; key: string; version: number }[]
  delivery: 'started_run' | 'pending' | 'delivered' | 'undelivered' | null
  delivered_in_step_id: string | null
  created_at: string
}

// Messages sent with POST /threads/{thread_id}/messages.
export const sentMessages = mockState<SentMessage[]>('sent-messages', () => [])
