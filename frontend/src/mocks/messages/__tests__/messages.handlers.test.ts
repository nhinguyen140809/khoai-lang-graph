import { afterEach, describe, expect, it } from 'vitest'

import type { Project } from '@/modules/project/entities'
import type { Run } from '@/modules/run/entities'
import type { Thread } from '@/modules/thread/entities'
import { apiUrl } from '@/shared/api/api-url.utils'

import { runIds, threadIds } from '../../shared/mock-ids.constants'
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
function post(path: string, body: string) {
  return call(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
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
  const created = (await post('/api/v1/projects', JSON.stringify(project))) as Answer<Project>
  const projectId = created.body.id
  const thread = (await post(`/api/v1/projects/${projectId}/threads`, '{}')) as Answer<Thread>
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
        `/api/v1/threads/${threadId}/messages`,
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
      expect((await call(`/api/v1/projects/${projectId}`)).body).toMatchObject({
        name: projectName,
        initial_message_id: sent.body.message.id,
        unfinished_run_counts: { queued: 0, running: 1, interrupted: 0 },
      })
      expect((await call(`/api/v1/threads/${threadId}`)).body).toMatchObject({
        current_stage: 'planning',
        active_run_id: sent.body.run.id,
        active_run_status: 'running',
      })
    },
  )

  it('leaves a message for the unfinished run of the thread', async () => {
    const sent = (await post(
      `/api/v1/threads/${threadIds.mentorMain}/messages`,
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
