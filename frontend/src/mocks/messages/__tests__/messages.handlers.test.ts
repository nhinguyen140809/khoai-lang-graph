import { afterEach, describe, expect, it } from 'vitest'

import type { Project } from '@/modules/project/entities'
import type { Run } from '@/modules/run/entities'
import type { Thread } from '@/modules/thread/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { apiUrl } from '@/shared/api/request/api-url.utils'

import { runIds, threadIds } from '../../shared/db/mock-ids.constants'
import { nameFromMessage, type SentMessage } from '../messages.handlers'
import {
  firstMessageCases,
  invalidMessageCases,
  nameFromMessageCases,
} from './messages.handlers.data'

interface Answer<T> {
  status: number
  body: T
}

interface Sent {
  message: SentMessage
  run: Run
}

const IDEA = 'Thesis tracker\nFor the supervisors of a faculty.'

async function call(path: string, init?: RequestInit) {
  const response = await fetch(apiUrl(path), init)
  const text = await response.text()
  const body: unknown = text === '' ? null : JSON.parse(text)
  return { status: response.status, body }
}

// The body goes as it is, so a case can also send text that is not JSON.
function post(path: string, body: string, idempotencyKey?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (idempotencyKey !== undefined) headers['Idempotency-Key'] = idempotencyKey
  return call(path, { method: 'POST', headers, body })
}

// A scenario of the mocks is chosen in the page address.
function openPage(address: string) {
  window.history.replaceState(null, '', address)
}

afterEach(() => {
  openPage('/')
})

/** Creates a project from the body of POST /projects, and a thread in it. */
async function newThread(project: object = {}) {
  const created = (await post(
    apiEndpoints.projects.path(),
    JSON.stringify(project),
  )) as Answer<Project>
  const projectId = created.body.id
  const thread = (await post(
    apiEndpoints.projectThreads.path({ projectId }),
    '{}',
  )) as Answer<Thread>
  return { projectId, threadId: thread.body.id }
}

describe('nameFromMessage', () => {
  it.each(nameFromMessageCases)('names a project from $name', ({ content, projectName }) => {
    expect(nameFromMessage(content)).toBe(projectName)
  })
})

describe('POST /threads/{thread_id}/messages', () => {
  it.each(firstMessageCases)(
    'starts the first run of $name with its first message',
    async ({ project, projectName }) => {
      const { projectId, threadId } = await newThread(project)

      const sent = (await post(
        apiEndpoints.threadMessages.path({ threadId }),
        JSON.stringify({ content: IDEA }),
      )) as Answer<Sent>

      expect(sent).toMatchObject({
        status: 201,
        body: {
          message: { thread_id: threadId, sequence: 1, content: IDEA, delivery: 'started_run' },
          run: { thread_id: threadId, project_id: projectId, number: 1, status: 'running' },
        },
      })
      expect(sent.body.message.run_id).toBe(sent.body.run.id)
      expect((await call(apiEndpoints.project.path({ projectId }))).body).toMatchObject({
        name: projectName,
        initial_message_id: sent.body.message.id,
        unfinished_run_counts: { queued: 0, running: 1, interrupted: 0 },
      })
      expect((await call(apiEndpoints.thread.path({ threadId }))).body).toMatchObject({
        current_stage: 'planning',
        active_run_id: sent.body.run.id,
        active_run_status: 'running',
      })
    },
  )

  it('leaves a message for the unfinished run of the thread', async () => {
    const sent = (await post(
      apiEndpoints.threadMessages.path({ threadId: threadIds.mentorMain }),
      JSON.stringify({ content: 'Also ask about group sessions.' }),
    )) as Answer<Sent>

    expect(sent).toMatchObject({
      status: 201,
      body: {
        message: { delivery: 'pending', run_id: runIds.mentorMain3 },
        run: { id: runIds.mentorMain3 },
      },
    })
  })

  it('starts no second run for a message sent again with its key', async () => {
    const { threadId } = await newThread()
    const path = apiEndpoints.threadMessages.path({ threadId })
    const body = JSON.stringify({ content: IDEA })

    const first = (await post(path, body, 'key-1')) as Answer<Sent>
    const again = (await post(path, body, 'key-1')) as Answer<Sent>

    expect(again).toEqual(first)
    const runs = (await call(apiEndpoints.threadRuns.path({ threadId }))).body as { items: Run[] }
    expect(runs.items).toHaveLength(1)
  })

  it('answers 409 to a message sent again with its key and other words', async () => {
    const { threadId } = await newThread()
    const path = apiEndpoints.threadMessages.path({ threadId })
    await post(path, JSON.stringify({ content: IDEA }), 'key-1')

    expect(await post(path, JSON.stringify({ content: 'Another idea.' }), 'key-1')).toMatchObject({
      status: 409,
      body: { code: 'idempotency_conflict' },
    })
  })

  it.each(invalidMessageCases)('answers 422 for $name', async ({ body }) => {
    const { threadId } = await newThread()

    expect(await post(`/api/v1/threads/${threadId}/messages`, body)).toMatchObject({
      status: 422,
      body: { errors: [{ field: 'content', message: 'Enter a message.' }] },
    })
  })

  it('answers 500 in the error scenario of sending a message', async () => {
    const { threadId } = await newThread()
    openPage('/?mock-send-message=error')

    expect(await post(`/api/v1/threads/${threadId}/messages`, '{"content": "Hi"}')).toMatchObject({
      status: 500,
      body: { code: 'internal_error' },
    })
  })

  it('answers 404 for a thread that does not exist', async () => {
    const { status } = await post('/api/v1/threads/no-such-thread/messages', '{"content": "Hi"}')

    expect(status).toBe(404)
  })
})
