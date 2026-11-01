import { afterEach, describe, expect, it } from 'vitest'

import type { Project } from '@/features/projects'
import { apiUrl } from '@/shared/api/api-url.utils'

import { PROJECT_IDS } from '../../shared/mock-ids.constants'
import { bulkProjectCount, extraProjectSpecs } from '../extra-project-specs.constants'
import { mockProjects } from '../projects.fixtures'

interface Page<T> {
  items: T[]
  next_cursor: string | null
}

interface Answer<T> {
  status: number
  headers: Headers
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
  return { status: response.status, headers: response.headers, body }
}

function post(path: string, body: unknown) {
  return call(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const projectCount = mockProjects.length + extraProjectSpecs.length

afterEach(() => {
  openPage('/')
})

describe('GET /projects', () => {
  it('lists every project, the latest activity first', async () => {
    const { status, body } = (await call('/api/v1/projects')) as Answer<Page<Project>>

    expect(status).toBe(200)
    expect(body.items).toHaveLength(projectCount)
    expect(body.next_cursor).toBeNull()
    const times = body.items.map(({ last_activity_at }) => last_activity_at)
    expect(times).toEqual(times.toSorted().reverse())
  })

  it('answers in pages that follow the cursor', async () => {
    const first = (await call('/api/v1/projects?limit=5')) as Answer<Page<Project>>
    const last = (await call(
      `/api/v1/projects?limit=5&cursor=${String(projectCount - 2)}`,
    )) as Answer<Page<Project>>

    expect(first.body.items).toHaveLength(5)
    expect(first.body.next_cursor).toBe('5')
    expect(last.body.items).toHaveLength(2)
    expect(last.body.next_cursor).toBeNull()
  })

  it('filters by status', async () => {
    const { body } = (await call('/api/v1/projects?status=archived')) as Answer<Page<Project>>

    expect(body.items.length).toBeGreaterThan(0)
    expect(body.items.every(({ status }) => status === 'archived')).toBe(true)
    expect(body.items.map(({ id }) => id)).toContain(PROJECT_IDS.laundry)
  })

  it('counts the unfinished runs of each project from its runs', async () => {
    const counts = async () => {
      const { body } = (await call('/api/v1/projects')) as Answer<Page<Project>>
      return new Map(body.items.map(({ id, unfinished_run_counts }) => [id, unfinished_run_counts]))
    }

    const waiting = await counts()
    expect(waiting.get(PROJECT_IDS.mentor)).toEqual({ queued: 0, running: 0, interrupted: 1 })
    expect(waiting.get(PROJECT_IDS.library)).toEqual({ queued: 0, running: 1, interrupted: 0 })
    expect(waiting.get(PROJECT_IDS.campus)).toEqual({ queued: 0, running: 0, interrupted: 0 })

    openPage('/?mock-run-state=running')
    expect((await counts()).get(PROJECT_IDS.mentor)).toEqual({
      queued: 0,
      running: 1,
      interrupted: 0,
    })
  })

  it('makes the list long with the many scenario', async () => {
    openPage('/?mock-projects=many')

    const { body } = (await call('/api/v1/projects?limit=200')) as Answer<Page<Project>>

    expect(body.items).toHaveLength(projectCount + bulkProjectCount)
  })

  it('answers the empty and error scenarios', async () => {
    openPage('/?mock-projects=empty')
    expect(((await call('/api/v1/projects')) as Answer<Page<Project>>).body).toEqual({
      items: [],
      next_cursor: null,
    })

    openPage('/?mock-projects=error')
    expect((await call('/api/v1/projects')).status).toBe(500)
  })
})

describe('GET /projects/{project_id}', () => {
  it('answers one project, with its unfinished runs', async () => {
    const { status, body } = (await call(
      `/api/v1/projects/${PROJECT_IDS.mentor}`,
    )) as Answer<Project>

    expect(status).toBe(200)
    expect(body).toMatchObject({
      name: 'Mentor platform',
      unfinished_run_counts: { queued: 0, running: 0, interrupted: 1 },
    })
  })

  it('answers 404 for a project that does not exist, or in the empty scenario', async () => {
    expect((await call('/api/v1/projects/no-such-project')).status).toBe(404)

    openPage('/?mock-project=empty')
    expect((await call(`/api/v1/projects/${PROJECT_IDS.mentor}`)).status).toBe(404)
  })

  it('answers 500 in the error scenario', async () => {
    openPage('/?mock-project=error')

    expect((await call(`/api/v1/projects/${PROJECT_IDS.mentor}`)).status).toBe(500)
  })
})

describe('POST /projects', () => {
  it('creates an active project with empty run settings, first in the list', async () => {
    const created = (await post('/api/v1/projects', {
      name: '  Clinic booking  ',
      description: 'Book a doctor.',
      output_language: 'vi',
    })) as Answer<Project>

    expect(created.status).toBe(201)
    expect(created.headers.get('Location')).toBe(`/api/v1/projects/${created.body.id}`)
    expect(created.body).toMatchObject({
      name: 'Clinic booking',
      description: 'Book a doctor.',
      output_language: 'vi',
      status: 'active',
      run_config: {
        review_checkpoints: null,
        max_steps: null,
        max_cost_usd: null,
        parameters: null,
      },
      unfinished_run_counts: { queued: 0, running: 0, interrupted: 0 },
    })
    expect((await call(`/api/v1/projects/${created.body.id}`)).status).toBe(200)
    const list = (await call('/api/v1/projects')) as Answer<Page<Project>>
    expect(list.body.items[0]?.id).toBe(created.body.id)
  })

  it('takes English and no description when they are not given', async () => {
    const created = (await post('/api/v1/projects', { name: 'Clinic booking' })) as Answer<Project>

    expect(created.body).toMatchObject({ description: null, output_language: 'en' })
  })

  it.each([{}, { name: '   ' }, { name: 3 }, null])(
    'asks for a name when the body is %j',
    async (body) => {
      const answer = await post('/api/v1/projects', body)

      expect(answer.status).toBe(422)
      expect(answer.body).toMatchObject({ errors: [{ field: 'name', message: 'Enter a name.' }] })
    },
  )

  it('asks for a language it has, and a description that is text', async () => {
    const answer = await post('/api/v1/projects', {
      name: 'Clinic booking',
      description: 42,
      output_language: 'fr',
    })

    expect(answer.status).toBe(422)
    expect(answer.body).toMatchObject({
      errors: [
        { field: 'description', message: 'Enter text, or nothing.' },
        { field: 'output_language', message: 'Choose a language.' },
      ],
    })
  })

  it('reads a body that is not JSON as a body without fields', async () => {
    const answer = await call('/api/v1/projects', { method: 'POST', body: 'not json' })

    expect(answer.status).toBe(422)
  })
})
