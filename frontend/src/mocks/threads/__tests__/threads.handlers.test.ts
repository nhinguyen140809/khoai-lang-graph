import { afterEach, describe, expect, it } from 'vitest'

import type { Thread } from '@/features/threads'
import { apiUrl } from '@/shared/api/api-url.utils'

import { extraProjectSpecs } from '../../projects/extra-project-specs.constants'
import { mockProjects } from '../../projects/projects.fixtures'
import { RUN_IDS, THREAD_IDS } from '../../shared/mock-ids.constants'
import { threadErrorCases, threadListCases, threadRunStateCases } from './threads.handlers.data'

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
  it('GET /threads lists one thread per project', async () => {
    const { body } = (await call('/api/v1/threads')) as Answer<Page<Thread>>

    expect(body.items).toHaveLength(mockProjects.length + extraProjectSpecs.length)
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

    expect(await mentorThread()).toMatchObject({ active_run_id: null, active_run_status: null })
  })

  it('has no run in the scenario without runs', async () => {
    openPage('/?mock-runs=empty')

    const { body } = (await call('/api/v1/threads')) as Answer<Page<Thread>>

    expect(body.items.every(({ active_run_id }) => active_run_id === null)).toBe(true)
  })
})

describe('errors', () => {
  it.each(threadErrorCases)(
    'answers $status to $request',
    async ({ address, path, status, code }) => {
      openPage(address)

      expect(await call(path)).toMatchObject({ status, body: { code } })
    },
  )
})
