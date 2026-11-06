import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { apiRequest, fetchPage, type ListPage } from '@/shared/api/request'

import {
  type Message,
  messageSchema,
  type SendMessageBody,
  type SentMessage,
  sentMessageSchema,
} from './messages.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** One page of the messages of a thread, in the order they were sent. */
export function listThreadMessages(
  threadId: string,
  cursor: string | null,
  limit: number,
): Promise<ListPage<Message>> {
  return fetchPage(apiEndpoints.threadMessages.path({ threadId }), messageSchema, {
    limit,
    cursor,
    action: 'load the messages of the thread',
  })
}

/**
 * Sends a message of the user to a thread: with no unfinished run it starts one, else it waits for
 * that run. The request goes with `idempotencyKey`, so that sending it again starts no second run.
 */
export function sendMessage(
  threadId: string,
  body: SendMessageBody,
  idempotencyKey: string,
): Promise<SentMessage> {
  return apiRequest(apiEndpoints.threadMessages.path({ threadId }), sentMessageSchema, {
    action: 'send the message',
    method: HttpMethod.Post,
    body,
    idempotencyKey,
  })
}
