import { afterEach, describe, expect, it } from 'vitest'

import type { Thread } from '@/modules/thread/entities'
import { apiUrl } from '@/shared/api/api-url.utils'

import { extraProjectSpecs } from '../../projects/extra-project-specs.constants'
import { mockProjects } from '../../projects/projects.fixtures'
import { PROJECT_IDS, RUN_IDS, THREAD_IDS } from '../../shared/mock-ids.constants'
import {
  createThreadCases,
  threadErrorCases,
  threadListCases,
  threadRunStateCases,
} from './threads.handlers.data'

interface Page<T> {
  items: T[]
  next_cursor: string | null
}

interface Answer<T> {
  status: number
  body: T
}

// A scenario of the mocks is chosen in the page address.
function openPage(address: string) {
  window.history.replaceState(null, '', address)
}

async function call(path: string, init?: RequestInit) {
  const response = await fetch(apiUrl(path), init)
  const text = await response.text()
  const body: unknown = text === '' ? null : JSON.parse(text)
  return { status: response.status, body }
}

async function mentorThread() {
  return ((await call(`/api/v1/threads/${THREAD_IDS.mentorMain}`)) as Answer<Thread>).body
}

afterEach(() => {
  openPage('/')
})

describe('the lists of threads', () => {
  it('GET /threads lists one thread per project, and the second thread of the mentor platform', async () => {
    const { body } = (await call('/api/v1/threads')) as Answer<Page<Thread>>

    expect(body.items).toHaveLength(mockProjects.length + extraProjectSpecs.length + 1)
  })

  it.each(threadListCases)('lists the threads for $request', async ({ address, path, ids }) => {
    openPage(address)

    const { body } = (await call(path)) as Answer<Page<Thread>>

    expect(body.items.map(({ id }) => id)).toEqual(ids)
  })
})

describe('GET /threads/{thread_id}', () => {
  it.each(threadRunStateCases)('answers a thread whose run $name', async ({ address, thread }) => {
    openPage(address)

    expect(await mentorThread()).toMatchObject(thread)
  })

  it('has no unfinished run once its run is stopped', async () => {
    await call(`/api/v1/runs/${RUN_IDS.mentorMain3}/cancel`, { method: 'POST' })

    expect(await mentorThread()).toMatchObject({
      active_run_id: null,
      latest_run_status: 'cancelled',
    })
  })

  it('has no run in the scenario without runs', async () => {
    openPage('/?mock-runs=empty')

    const { body } = (await call('/api/v1/threads')) as Answer<Page<Thread>>

    expect(body.items.every(({ active_run_id }) => active_run_id === null)).toBe(true)
  })
})

describe('POST /projects/{project_id}/threads', () => {
  it.each(createThreadCases)(
    'creates an empty thread of the project from $name',
    async ({ body, title }) => {
      const path = `/api/v1/projects/${PROJECT_IDS.campus}/threads`
      const created = (await call(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })) as Answer<Thread>

      expect(created).toMatchObject({
        status: 201,
        body: { project_id: PROJECT_IDS.campus, title, active_run_id: null, current_stage: null },
      })
      const list = (await call(path)) as Answer<Page<Thread>>
      expect(list.body.items.map(({ id }) => id)).toContain(created.body.id)
    },
  )
})

describe('errors', () => {
  it.each(threadErrorCases)(
    'answers $status to $request',
    async ({ address, method, path, status, code }) => {
      openPage(address)

      expect(await call(path, { method })).toMatchObject({ status, body: { code } })
    },
  )
})
