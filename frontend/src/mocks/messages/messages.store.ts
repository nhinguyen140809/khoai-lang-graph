import type { Message } from '@/modules/thread/entities'

import { mockState } from '../shared/db'

// Messages sent with POST /threads/{thread_id}/messages.
export const createdMessages = mockState<Message[]>('created-messages', () => [])
