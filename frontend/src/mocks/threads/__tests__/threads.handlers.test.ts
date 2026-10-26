import { describe, expect, it } from 'vitest'

import type { Thread } from '@/modules/thread/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import type { ListPage } from '@/shared/api/request'
import type { ApiAnswer } from '@/test/msw'
import { fetchApi, openPage } from '@/test/msw'

import { generatedProjectSpecs } from '../../generated/fixtures/generated-project-specs.fixtures'
import { projectFixtures } from '../../projects/projects.fixtures'
import { runIds, threadIds } from '../../shared/db/mock-ids.constants'
import { threadErrorCases, threadListCases, threadRunStateCases } from './threads.handlers.data'

// A scenario of the mocks is chosen in the page address.
async function mentorThread() {
  return (
    (await fetchApi(
      apiEndpoints.thread.path({ threadId: threadIds.mentorMain }),
    )) as ApiAnswer<Thread>
  ).body
}

describe('the lists of threads', () => {
  it('GET /threads lists one thread per project', async () => {
    const { body } = (await fetchApi(apiEndpoints.threads.path())) as ApiAnswer<ListPage<Thread>>

    expect(body.items).toHaveLength(projectFixtures.length + generatedProjectSpecs.length)
  })

  it.each(threadListCases)('lists the threads for $request', async ({ address, path, ids }) => {
    openPage(address)

    const { body } = (await fetchApi(path)) as ApiAnswer<ListPage<Thread>>

    expect(body.items.map(({ id }) => id)).toEqual(ids)
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

    expect(await mentorThread()).toMatchObject({ active_run_id: null, active_run_status: null })
  })

  it('has no run in the scenario without runs', async () => {
    openPage('/?mock-runs=empty')

    const { body } = (await fetchApi(apiEndpoints.threads.path())) as ApiAnswer<ListPage<Thread>>

    expect(body.items.every(({ active_run_id }) => active_run_id === null)).toBe(true)
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
