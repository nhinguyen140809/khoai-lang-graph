import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader } from '@/shared/api/http'
import type { SentRequestCase } from '@/test/suites'

import { listThreadMessages, sendMessage } from '../messages.api'

/** A call of the message API, and the request it sends. */
export const sentMessageRequestCases = [
  {
    name: 'reads the first page of the messages of a thread',
    call: () => listThreadMessages('t 1', null, 20),
    request: {
      method: 'GET',
      path: `${apiEndpoints.threadMessages.path({ threadId: 't 1' })}?limit=20`,
      body: null,
    },
  },
  {
    name: 'reads the next page of the messages of a thread, with the cursor',
    call: () => listThreadMessages('t 1', 'next', 20),
    request: {
      method: 'GET',
      path: `${apiEndpoints.threadMessages.path({ threadId: 't 1' })}?limit=20&cursor=next`,
      body: null,
    },
  },
  {
    name: 'sends a message, with the idempotency key',
    call: () =>
      sendMessage(
        't 1',
        {
          content: 'Also ask the mentors how they want to be paid.',
          run_config: {
            review_checkpoints: null,
            max_steps: 40,
            max_cost_usd: null,
            parameters: null,
          },
          models: { analyst: 'anthropic:claude-sonnet-5' },
        },
        'key-1',
      ),
    request: {
      method: 'POST',
      path: apiEndpoints.threadMessages.path({ threadId: 't 1' }),
      body: {
        content: 'Also ask the mentors how they want to be paid.',
        run_config: {
          review_checkpoints: null,
          max_steps: 40,
          max_cost_usd: null,
          parameters: null,
        },
        models: { analyst: 'anthropic:claude-sonnet-5' },
      },
      headers: { [HttpHeader.IdempotencyKey]: 'key-1' },
    },
  },
] satisfies SentRequestCase[]
