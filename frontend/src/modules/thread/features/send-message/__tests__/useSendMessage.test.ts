import type { QueryClient } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { projectIds, runIds, threadIds } from '@/mocks/shared/db'
import { buildThread } from '@/mocks/threads/threads.fixtures'
import { type RunDefaults } from '@/modules/run/entities'
import { type Thread, useThreadMessages } from '@/modules/thread/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import { recordRequests } from '@/test/msw'
import { createTestQueryClient, renderHookWithProviders } from '@/test/render'
import { itToastsOnResult } from '@/test/suites'

import { useSendMessage } from '../useSendMessage'

// The thread of the activity of the mentor platform, as the mock serves it.
const mentorThread: Thread = buildThread({
  id: threadIds.mentorMain,
  project_id: projectIds.mentor,
})

// A thread whose runs all ended, so a message starts one.
const idleThread: Thread = buildThread({
  id: threadIds.campusMain,
  project_id: projectIds.mentor,
  active_run_id: null,
  latest_run_status: 'succeeded',
})

function sendWith(
  thread: Thread | null,
  content: string,
  runConfig?: RunDefaults,
  queryClient?: QueryClient,
) {
  const onSent = vi.fn()
  const { result } = renderHookWithProviders(
    () => useSendMessage({ projectId: projectIds.mentor, thread }),
    queryClient === undefined ? {} : { queryClient },
  )
  result.current.send(content, { runConfig, onSent })
  return { result, onSent }
}

describe('useSendMessage', () => {
  it('sends the message to the thread', async () => {
    const requests = recordRequests(['idempotency-key'])
    sendWith(mentorThread, 'Also ask about group sessions.')

    await waitFor(() => {
      expect(
        requests.some(
          ({ method, path }) =>
            method === 'POST' && path.includes(`/threads/${threadIds.mentorMain}/messages`),
        ),
      ).toBe(true)
    })
  })

  it('creates a thread with the first message for a project without one', async () => {
    const requests = recordRequests()
    sendWith(null, 'I want to build an online platform.')

    await waitFor(() => {
      expect(
        requests.some(
          ({ method, path }) =>
            method === 'POST' && path.includes(`/projects/${projectIds.mentor}/threads`),
        ),
      ).toBe(true)
    })
  })

  it('sends the run settings with a message that starts a run', async () => {
    const requests = recordRequests()
    sendWith(idleThread, 'Another request.', {
      review_checkpoints: null,
      max_steps: 40,
      max_cost_usd: 1,
      parameters: null,
    })

    await waitFor(() => {
      expect(
        requests.some(
          ({ method, path, body }) =>
            method === 'POST' &&
            path.includes(`/threads/${threadIds.campusMain}/messages`) &&
            (body as { run_config?: { max_steps?: number } }).run_config?.max_steps === 40,
        ),
      ).toBe(true)
    })
  })

  it('sends no run settings while the thread has an unfinished run', async () => {
    const requests = recordRequests()
    const busy: Thread = buildThread({
      id: threadIds.mentorMain,
      project_id: projectIds.mentor,
      active_run_id: runIds.mentorMain3,
    })
    sendWith(busy, 'A message that joins the run.', {
      review_checkpoints: null,
      max_steps: 40,
      max_cost_usd: 1,
      parameters: null,
    })

    await waitFor(() => {
      expect(
        requests.some(
          ({ method, path }) =>
            method === 'POST' && path.includes(`/threads/${threadIds.mentorMain}/messages`),
        ),
      ).toBe(true)
    })
    const sent = requests.find(
      ({ method, path }) =>
        method === 'POST' && path.includes(`/threads/${threadIds.mentorMain}/messages`),
    )
    expect((sent?.body as { run_config?: unknown }).run_config).toBeUndefined()
  })

  it('runs onSent after success, and the messages load again', async () => {
    const requests = recordRequests()
    // The messages of the thread are on screen, as the activity reads them, in the same cache as
    // the send.
    const queryClient = createTestQueryClient()
    const messages = renderHookWithProviders(() => useThreadMessages(threadIds.mentorMain), {
      queryClient,
    })
    await waitFor(() => {
      expect(requests.some(({ path }) => path.includes('/messages'))).toBe(true)
    })

    const { onSent } = sendWith(mentorThread, 'A message.', undefined, queryClient)

    await waitFor(() => {
      expect(onSent).toHaveBeenCalledOnce()
    })
    // The list of the messages loads again after the send.
    await waitFor(() => {
      expect(
        requests.filter(
          ({ method, path }) =>
            method === 'GET' && path.includes(`/threads/${threadIds.mentorMain}/messages`),
        ).length,
      ).toBeGreaterThan(1)
    })
    messages.unmount()
  })

  itToastsOnResult([
    {
      name: 'a send the server refuses',
      refuse: () => {
        server.use(
          http.post(apiEndpoints.threadMessages.pattern, () =>
            Response.json({ error: 'no' }, { status: HttpStatus.InternalServerError }),
          ),
        )
      },
      start: () => {
        sendWith(mentorThread, 'A message that fails.')
      },
      kind: 'error',
      message: 'The message was not sent. Failed to send the message (HTTP 500)',
    },
  ])
})
