import { describe, expect, it } from 'vitest'

import { threadIds } from '@/mocks/shared/db'
import { assistanceDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'
import { openPage } from '@/test/msw'
import { itSendsRequests } from '@/test/suites'

import { listThreadMessages, sendMessage } from '../messages.api'
import { sentMessageRequestCases } from './messages.api.data'

describe('the message API', () => {
  it('reads the messages of the mentor thread in the order they were sent', async () => {
    const page = await listThreadMessages(threadIds.mentorMain, null, 50)

    expect(page.items.map(({ sequence }) => sequence)).toEqual([1, 2, 3, 4, 5, 6])
    expect(page.next_cursor).toBeNull()
  })

  it('sends a message to a thread whose run has ended, which starts a new run', async () => {
    openPage('/?mock-run-status=done')

    const sent = await sendMessage(threadIds.mentorMain, { content: 'Another question.' }, 'key-1')

    expect(sent.message).toMatchObject({
      sequence: 7,
      content: 'Another question.',
      delivery: 'started_run',
    })
    expect(sent.run).toMatchObject({ number: 4, status: 'running' })
    expect(sent.commands).toEqual([])
    expect(sent.message.run_id).toBe(sent.run.id)
  })

  it('reads the answer of the assistant to a message about the app, with its finished run', async () => {
    const sent = await sendMessage(
      threadIds.mentorMain,
      { content: 'Where are the limits?' },
      'key-2',
    )

    expect(sent.run).toMatchObject({
      workflow_name: assistanceDefinitionFixture.name,
      status: 'succeeded',
    })
    expect(sent.message).toMatchObject({ run_id: sent.run.id, delivery: null })
    expect(sent.commands).toMatchObject([
      { command: 'open_settings', artifact_id: null, item_id: null },
    ])
  })

  itSendsRequests(sentMessageRequestCases)
})
