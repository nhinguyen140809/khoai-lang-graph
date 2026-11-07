import { describe, expect, it } from 'vitest'

import { threadIds } from '@/mocks/shared/db'
import { openPage } from '@/test/msw'
import { itSendsRequests } from '@/test/suites'

import { listThreadMessages, sendMessage } from '../messages.api'
import { sentMessageRequestCases } from './messages.api.data'

describe('the message API', () => {
  it('reads the messages of the mentor thread in the order they were sent', async () => {
    const page = await listThreadMessages(threadIds.mentorMain, null, 50)

    expect(page.items.map(({ sequence }) => sequence)).toEqual([1, 2, 3, 4])
    expect(page.next_cursor).toBeNull()
  })

  it('sends a message to a thread whose run has ended, which starts a new run', async () => {
    openPage('/?mock-run-status=done')

    const sent = await sendMessage(threadIds.mentorMain, { content: 'Another question.' }, 'key-1')

    expect(sent.message).toMatchObject({
      sequence: 5,
      content: 'Another question.',
      delivery: 'started_run',
    })
    expect(sent.run).toMatchObject({ number: 4, status: 'running' })
    expect(sent.message.run_id).toBe(sent.run.id)
  })

  itSendsRequests(sentMessageRequestCases)
})
