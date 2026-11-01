import { afterEach, describe, expect, it } from 'vitest'

import type { Thread } from '@/features/threads'
import { apiUrl } from '@/shared/api/api-url.utils'

import { extraProjectSpecs } from '../../projects/extra-project-specs.constants'
import { mockProjects } from '../../projects/projects.fixtures'
import { PROJECT_IDS, RUN_IDS, THREAD_IDS } from '../../shared/mock-ids.constants'

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

describe('GET /threads', () => {
  it('lists one thread per project', async () => {
    const { body } = (await call('/api/v1/threads')) as Answer<Page<Thread>>

    expect(body.items).toHaveLength(mockProjects.length + extraProjectSpecs.length)
  })

  it('filters by project', async () => {
    const { body } = (await call(`/api/v1/threads?project_id=${PROJECT_IDS.library}`)) as Answer<
      Page<Thread>
    >

    expect(body.items.map(({ id }) => id)).toEqual([THREAD_IDS.libraryMain])
  })

  it('answers the empty and error scenarios', async () => {
    openPage('/?mock-threads=empty')
    expect(((await call('/api/v1/threads')) as Answer<Page<Thread>>).body.items).toEqual([])

    openPage('/?mock-threads=error')
    expect((await call('/api/v1/threads')).status).toBe(500)
  })
})

describe('GET /projects/{project_id}/threads', () => {
  it('lists the threads of a project', async () => {
    const { body } = (await call(`/api/v1/projects/${PROJECT_IDS.mentor}/threads`)) as Answer<
      Page<Thread>
    >

    expect(body.items.map(({ id }) => id)).toEqual([THREAD_IDS.mentorMain])
  })

  it('answers 404 for a project that does not exist', async () => {
    expect((await call('/api/v1/projects/no-such-project/threads')).status).toBe(404)
  })

  it('lists no thread in the empty scenario', async () => {
    openPage('/?mock-threads=empty')

    const { body } = (await call(`/api/v1/projects/${PROJECT_IDS.mentor}/threads`)) as Answer<
      Page<Thread>
    >

    expect(body.items).toEqual([])
  })
})

describe('GET /threads/{thread_id}', () => {
  it('answers a thread with its unfinished run', async () => {
    expect(await mentorThread()).toMatchObject({
      project_id: PROJECT_IDS.mentor,
      active_run_id: RUN_IDS.mentorMain3,
      active_run_status: 'interrupted',
      current_stage: 'analysis_review',
    })
  })

  it('follows the state of its run', async () => {
    openPage('/?mock-run-state=running')
    expect(await mentorThread()).toMatchObject({ active_run_status: 'running' })

    openPage('/?mock-run-state=done')
    expect(await mentorThread()).toMatchObject({ active_run_id: null, active_run_status: null })
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

  it('answers 404 for a thread that does not exist, or in the empty scenario', async () => {
    expect((await call('/api/v1/threads/no-such-thread')).status).toBe(404)

    openPage('/?mock-thread=empty')
    expect((await call(`/api/v1/threads/${THREAD_IDS.mentorMain}`)).status).toBe(404)
  })

  it('answers 500 in the error scenario', async () => {
    openPage('/?mock-thread=error')

    expect((await call(`/api/v1/threads/${THREAD_IDS.mentorMain}`)).status).toBe(500)
  })
})
