import { describe, expect, it } from 'vitest'

import type { Project } from '@/modules/project/entities'
import type { Run } from '@/modules/run/entities'
import type { Message, Thread } from '@/modules/thread/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpStatus } from '@/shared/api/http'
import type { ApiAnswer } from '@/test/msw'
import { fetchApi, getApiItems, openPage, postApi } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import { IdPrefix, mockId, runIds, threadIds } from '../../shared/db'
import { firstMessageCases, messageRejectedCases } from './messages.handlers.data'

interface Sent {
  message: Message
  run: Run
}

const IDEA = 'Thesis tracker\nFor the supervisors of a faculty.'

/** Creates a project from the body of POST /projects, and a thread in it. */
async function newThread(project: object = {}) {
  const created = (await postApi(apiEndpoints.projects.path(), project)) as ApiAnswer<Project>
  const projectId = created.body.id
  const thread = (await postApi(
    apiEndpoints.projectThreads.path({ projectId }),
    '{}',
  )) as ApiAnswer<Thread>
  return { projectId, threadId: thread.body.id }
}

describe('GET /threads/{thread_id}/messages', () => {
  it('lists the six messages of the mentor thread in the order they were sent', async () => {
    const messages = await getApiItems<Message>(
      apiEndpoints.threadMessages.path({ threadId: threadIds.mentorMain }),
    )

    expect(messages.map(({ sequence, author }) => ({ sequence, author }))).toEqual([
      { sequence: 1, author: 'user' },
      { sequence: 2, author: 'agent' },
      { sequence: 3, author: 'user' },
      { sequence: 4, author: 'user' },
      { sequence: 5, author: 'agent' },
      { sequence: 6, author: 'user' },
    ])
  })

  it('answers the empty page in the empty scenario', async () => {
    openPage('/?mock-messages=empty')

    expect(
      await getApiItems<Message>(
        apiEndpoints.threadMessages.path({ threadId: threadIds.mentorMain }),
      ),
    ).toEqual([])
  })

  it('lists the first message of a generated project', async () => {
    const messages = await getApiItems<Message>(
      apiEndpoints.threadMessages.path({ threadId: mockId(IdPrefix.Thread, 5) }),
    )

    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatchObject({
      sequence: 1,
      content: 'Patients of a small clinic should book appointments online instead of phoning.',
      delivery: 'started_run',
    })
  })

  it('lists a sent message last', async () => {
    await postApi(apiEndpoints.threadMessages.path({ threadId: threadIds.mentorMain }), {
      content: 'Another question.',
    })

    const messages = await getApiItems<Message>(
      apiEndpoints.threadMessages.path({ threadId: threadIds.mentorMain }),
    )
    expect(messages.at(-1)).toMatchObject({ sequence: 7, content: 'Another question.' })
  })
})

describe('POST /threads/{thread_id}/messages', () => {
  it.each(firstMessageCases)(
    'starts the first run of $name with its first message',
    async ({ project, projectName }) => {
      const { projectId, threadId } = await newThread(project)

      const sent = (await postApi(apiEndpoints.threadMessages.path({ threadId }), {
        content: IDEA,
      })) as ApiAnswer<Sent>

      expect(sent).toMatchObject({
        status: HttpStatus.Created,
        body: {
          message: { thread_id: threadId, sequence: 1, content: IDEA, delivery: 'started_run' },
          run: { thread_id: threadId, project_id: projectId, number: 1, status: 'running' },
        },
      })
      expect(sent.body.message.run_id).toBe(sent.body.run.id)
      expect((await fetchApi(apiEndpoints.project.path({ projectId }))).body).toMatchObject({
        name: projectName,
        initial_message_id: sent.body.message.id,
        unfinished_run_counts: { queued: 0, running: 1, interrupted: 0 },
      })
      expect((await fetchApi(apiEndpoints.thread.path({ threadId }))).body).toMatchObject({
        current_stage: 'planning',
        active_run_id: sent.body.run.id,
        latest_run_status: 'running',
        title: 'Thesis tracker',
      })
    },
  )

  it('leaves a message for the unfinished run of the thread', async () => {
    const sent = (await postApi(
      apiEndpoints.threadMessages.path({ threadId: threadIds.mentorMain }),
      {
        content: 'Also ask about group sessions.',
      },
    )) as ApiAnswer<Sent>

    expect(sent).toMatchObject({
      status: HttpStatus.Created,
      body: {
        message: { delivery: 'pending', run_id: runIds.mentorMain3 },
        run: { id: runIds.mentorMain3 },
      },
    })
  })

  it('starts no second run for a message sent again with its key', async () => {
    const { threadId } = await newThread()
    const path = apiEndpoints.threadMessages.path({ threadId })
    const body = { content: IDEA }

    const first = (await postApi(path, body, {
      [HttpHeader.IdempotencyKey]: 'key-1',
    })) as ApiAnswer<Sent>
    const again = (await postApi(path, body, {
      [HttpHeader.IdempotencyKey]: 'key-1',
    })) as ApiAnswer<Sent>

    expect({ status: again.status, body: again.body }).toEqual({
      status: first.status,
      body: first.body,
    })
    const runs = (await fetchApi(apiEndpoints.threadRuns.path({ threadId }))).body as {
      items: Run[]
    }
    expect(runs.items).toHaveLength(1)
  })

  it('answers 409 to a message sent again with its key and other words', async () => {
    const { threadId } = await newThread()
    const path = apiEndpoints.threadMessages.path({ threadId })
    await postApi(path, { content: IDEA }, { [HttpHeader.IdempotencyKey]: 'key-1' })

    expect(
      await postApi(path, { content: 'Another idea.' }, { [HttpHeader.IdempotencyKey]: 'key-1' }),
    ).toMatchObject({
      status: HttpStatus.Conflict,
      body: { code: 'idempotency_conflict' },
    })
  })

  itRejectsRequests(messageRejectedCases)
})
