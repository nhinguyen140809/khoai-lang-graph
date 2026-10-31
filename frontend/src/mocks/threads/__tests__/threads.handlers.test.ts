import { describe, expect, it } from 'vitest'

import type { Thread } from '@/modules/thread/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { fetchApi, getApi, getApiItems, openPage } from '@/test/msw'

import { generatedProjectSpecs } from '../../generated/fixtures/generated-project-specs.fixtures'
import { projectFixtures } from '../../projects/projects.fixtures'
import { runIds, threadIds } from '../../shared/db'
import { threadErrorCases, threadListCases, threadRunStateCases } from './threads.handlers.data'

// A scenario of the mocks is chosen in the page address.
function mentorThread() {
  return getApi<Thread>(apiEndpoints.thread.path({ threadId: threadIds.mentorMain }))
}

describe('the lists of threads', () => {
  it('GET /threads lists one thread per project', async () => {
    const items = await getApiItems<Thread>(apiEndpoints.threads.path())

    expect(items).toHaveLength(projectFixtures.length + generatedProjectSpecs.length)
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

describe('errors', () => {
  it.each(threadErrorCases)(
    'answers $status to $request',
    async ({ address, path, status, code }) => {
      openPage(address)

      expect(await fetchApi(path)).toMatchObject({ status, body: { code } })
    },
  )
})
