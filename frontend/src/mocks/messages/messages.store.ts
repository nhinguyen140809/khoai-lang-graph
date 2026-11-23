import type { Message } from '@/modules/thread/entities'

import { mockState } from '../shared/db'
import type { PendingAnswer } from './messages.types'

// Messages sent with POST /threads/{thread_id}/messages.
export const createdMessages = mockState<Message[]>('created-messages', () => [])

// The answers of the assistant that are still being written, until their run ends.
export const pendingAnswers = mockState<PendingAnswer[]>('pending-answers', () => [])
