import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { projectIds, threadIds } from '@/mocks/shared/db'
import { created } from '@/mocks/shared/http/response'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader } from '@/shared/api/http'
import { openPage } from '@/test/msw'
import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import { getThread, sendFirstMessage } from '../threads.api'
import {
  createdThread,
  sentMessage,
  sentThreadRequestCases,
  threadApiErrorCases,
} from './threads.api.data'

describe('the thread API', () => {
  it('reads the thread of the mentor platform with the status of its latest run', async () => {
    await expect(getThread(threadIds.mentorMain)).resolves.toMatchObject({
      id: threadIds.mentorMain,
      project_id: projectIds.mentor,
      current_stage: 'analysis_review',
      latest_run_status: 'interrupted',
    })
  })

  it('reads the thread of the mentor platform once its run has ended', async () => {
    openPage('/?mock-run-status=done')

    await expect(getThread(threadIds.mentorMain)).resolves.toMatchObject({
      current_stage: 'done',
      active_run_id: null,
      latest_run_status: 'succeeded',
    })
  })

  itSendsRequests(sentThreadRequestCases)

  itThrowsApiErrors(threadApiErrorCases)
})

describe('sendFirstMessage', () => {
  it('sends the key with the message and not with the thread', async () => {
    const keys: Record<string, string | null> = {}
    server.use(
      http.post(apiEndpoints.projectThreads.path({ projectId: 'p1' }), ({ request }) => {
        keys.thread = request.headers.get(HttpHeader.IdempotencyKey)
        return created(createdThread)
      }),
      http.post(apiEndpoints.threadMessages.path({ threadId: 't1' }), ({ request }) => {
        keys.message = request.headers.get(HttpHeader.IdempotencyKey)
        return created(sentMessage)
      }),
    )

    await sendFirstMessage('p1', 'An idea', 'key-1')

    expect(keys).toEqual({ thread: null, message: 'key-1' })
  })
})
