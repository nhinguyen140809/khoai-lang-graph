import { describe, expect, it } from 'vitest'

import type { Thread } from '@/modules/thread/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import type { ApiAnswer } from '@/test/msw'
import { deleteApi, fetchApi, getApi, getApiItems, openPage, patchApi, postApi } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import { generatedProjectSpecs } from '../../generated/fixtures/generated-project-specs.fixtures'
import { projectFixtures } from '../../projects/projects.fixtures'
import { projectIds, runIds, threadIds } from '../../shared/db'
import {
  threadErrorCases,
  threadListCases,
  threadRejectedCases,
  threadRunStateCases,
} from './threads.handlers.data'

// A scenario of the mocks is chosen in the page address.
function mentorThread() {
  return getApi<Thread>(apiEndpoints.thread.path({ threadId: threadIds.mentorMain }))
}

describe('the lists of threads', () => {
  it('GET /threads lists one thread per project', async () => {
    const items = await getApiItems<Thread>(apiEndpoints.threads.path())

    expect(items).toHaveLength(projectFixtures.length + generatedProjectSpecs.length)
  })

  it('lists the threads newest message first', async () => {
    const items = await getApiItems<Thread>(apiEndpoints.threads.path())

    const times = items.map(({ last_message_at }) => last_message_at)
    expect(times).toEqual([...times].toSorted((a, b) => b.localeCompare(a)))
  })

  it.each(threadListCases)('lists the threads for $request', async ({ address, path, ids }) => {
    openPage(address)

    const items = await getApiItems<Thread>(path)

    expect(items.map(({ id }) => id)).toEqual(ids)
  })
})

describe('GET /threads/{thread_id}', () => {
  it.each(threadRunStateCases)('answers a thread whose run $name', async ({ address, thread }) => {
    openPage(address)

    expect(await mentorThread()).toMatchObject(thread)
  })

  it('has no unfinished run once its run is stopped', async () => {
    await fetchApi(apiEndpoints.runCancel.path({ runId: runIds.mentorMain3 }), {
      method: 'POST',
    })

    expect(await mentorThread()).toMatchObject({
      active_run_id: null,
      latest_run_status: 'cancelled',
    })
  })

  it('has no run in the scenario without runs', async () => {
    openPage('/?mock-runs=empty')

    const items = await getApiItems<Thread>(apiEndpoints.threads.path())

    expect(
      items.every(
        ({ active_run_id, latest_run_status }) =>
          active_run_id === null && latest_run_status === null,
      ),
    ).toBe(true)
  })
})

describe('POST /projects/{project_id}/threads', () => {
  it('creates an empty thread with a title, and reads it after', async () => {
    const answered = (await postApi(
      apiEndpoints.projectThreads.path({ projectId: projectIds.mentor }),
      { title: 'Interviews' },
    )) as ApiAnswer<Thread>

    expect(answered).toMatchObject({ status: HttpStatus.Created, body: { title: 'Interviews' } })
    expect(
      await getApi<Thread>(apiEndpoints.thread.path({ threadId: answered.body.id })),
    ).toMatchObject({ id: answered.body.id, current_stage: null, latest_run_status: null })
  })

  it('creates a thread without a title', async () => {
    const answered = (await postApi(
      apiEndpoints.projectThreads.path({ projectId: projectIds.mentor }),
      {},
    )) as ApiAnswer<Thread>

    expect(answered.body.title).toBeNull()
  })
})

describe('PATCH /threads/{thread_id}', () => {
  it('renames a thread, and GET reads the change', async () => {
    const answered = (await patchApi(apiEndpoints.thread.path({ threadId: threadIds.campusMain }), {
      title: 'Renamed',
    })) as ApiAnswer<Thread>

    expect(answered.body).toMatchObject({ title: 'Renamed' })
    expect(
      await getApi<Thread>(apiEndpoints.thread.path({ threadId: threadIds.campusMain })),
    ).toMatchObject({ title: 'Renamed' })
  })

  it('archives a thread, and makes it active again', async () => {
    const path = apiEndpoints.thread.path({ threadId: threadIds.campusMain })

    expect((await patchApi(path, { status: 'archived' })).body).toMatchObject({
      status: 'archived',
    })
    expect((await patchApi(path, { status: 'active' })).body).toMatchObject({ status: 'active' })
  })
})

describe('DELETE /threads/{thread_id}', () => {
  it('deletes a thread whose run has ended, and every endpoint of it answers 404', async () => {
    openPage('/?mock-run-status=done')

    expect(
      await deleteApi(apiEndpoints.thread.path({ threadId: threadIds.mentorMain })),
    ).toMatchObject({ status: HttpStatus.NoContent })
    expect(
      await getApi<Thread>(apiEndpoints.thread.path({ threadId: threadIds.mentorMain })),
    ).toMatchObject({ status: HttpStatus.NotFound })
    expect(
      await getApi<Thread[]>(apiEndpoints.threadMessages.path({ threadId: threadIds.mentorMain })),
    ).toMatchObject({ status: HttpStatus.NotFound })
    expect(
      await postApi(apiEndpoints.threadMessages.path({ threadId: threadIds.mentorMain }), {
        content: 'Hi',
      }),
    ).toMatchObject({ status: HttpStatus.NotFound })

    expect(
      await getApiItems<Thread>(apiEndpoints.projectThreads.path({ projectId: projectIds.mentor })),
    ).toEqual([])
  })
})

describe('errors', () => {
  it.each(threadErrorCases)(
    'answers $status to $request',
    async ({ address, path, status, code }) => {
      openPage(address)

      expect(await fetchApi(path)).toMatchObject({ status, body: { code } })
    },
  )

  itRejectsRequests(threadRejectedCases)
})
