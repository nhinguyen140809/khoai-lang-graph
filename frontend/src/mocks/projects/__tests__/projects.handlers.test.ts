import { afterEach, describe, expect, it } from 'vitest'

import type { Project } from '@/modules/project/entities'
import { apiUrl } from '@/shared/api/request/api-url.utils'

import { projectIds } from '../../shared/mock-ids.constants'
import {
  createProjectCases,
  createProjectScenarioCases,
  invalidProjectCases,
  invalidProjectChangeCases,
  pendingProjectCases,
  projectErrorCases,
  projectFilterCases,
  projectListCases,
  projectStatusChangeCases,
  rollupRunStatusCases,
  unfinishedRunCountCases,
} from './projects.handlers.data'

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

// The body goes as it is, so a case can also send text that is not JSON.
function send(method: string, path: string, body: string) {
  return call(path, { method, headers: { 'Content-Type': 'application/json' }, body })
}

function post(path: string, body: string) {
  return send('POST', path, body)
}

async function listedIds(query: string) {
  const { body } = (await call(`/api/v1/projects?${query}&limit=200`)) as Answer<Page<Project>>
  return body.items.map(({ id }) => id)
}

afterEach(() => {
  openPage('/')
})

describe('GET /projects', () => {
  it.each(projectListCases)('answers $name', async ({ address, query, count, nextCursor }) => {
    openPage(address)

    const { status, body } = (await call(`/api/v1/projects${query}`)) as Answer<Page<Project>>

    expect(status).toBe(200)
    expect(body.items).toHaveLength(count)
    expect(body.next_cursor).toBe(nextCursor)
  })

  it('lists the latest activity first', async () => {
    const { body } = (await call('/api/v1/projects')) as Answer<Page<Project>>

    const times = body.items.map(({ last_activity_at }) => last_activity_at)
    expect(times).toEqual(times.toSorted().reverse())
  })

  it.each(projectFilterCases)('filters by $name', async ({ query, keeps }) => {
    const all = (await call('/api/v1/projects?limit=200')) as Answer<Page<Project>>
    const { body } = (await call(`/api/v1/projects${query}&limit=200`)) as Answer<Page<Project>>

    expect(body.items.length).toBeGreaterThan(0)
    expect(body.items.length).toBeLessThan(all.body.items.length)
    expect(body.items.every(keeps)).toBe(true)
  })

  it('filters by status', async () => {
    const { body } = (await call('/api/v1/projects?status=archived')) as Answer<Page<Project>>

    expect(body.items.length).toBeGreaterThan(0)
    expect(body.items.every(({ status }) => status === 'archived')).toBe(true)
    expect(body.items.map(({ id }) => id)).toContain(projectIds.laundry)
  })

  it.each(unfinishedRunCountCases)(
    'counts the unfinished runs of $name',
    async ({ address, projectId, counts }) => {
      openPage(address)

      const { body } = (await call('/api/v1/projects')) as Answer<Page<Project>>

      expect(body.items.find(({ id }) => id === projectId)?.unfinished_run_counts).toEqual(counts)
    },
  )
})

describe('the rollup run status of a project', () => {
  it.each(rollupRunStatusCases)(
    'is in GET /projects for $name',
    async ({ address, projectId, status }) => {
      openPage(address)

      const { body } = (await call('/api/v1/projects')) as Answer<Page<Project>>

      expect(body.items.find(({ id }) => id === projectId)?.rollup_run_status).toBe(status)
    },
  )
})

describe('GET /projects/{project_id}', () => {
  it('answers one project, with its unfinished runs', async () => {
    const { status, body } = (await call(
      `/api/v1/projects/${projectIds.mentor}`,
    )) as Answer<Project>

    expect(status).toBe(200)
    expect(body).toMatchObject({
      name: 'Mentor platform',
      unfinished_run_counts: { queued: 0, running: 0, interrupted: 1 },
    })
  })
})

describe('POST /projects', () => {
  it.each(createProjectCases)(
    'creates an active project from $name, first in the list',
    async ({ body, fields }) => {
      const created = (await post('/api/v1/projects', JSON.stringify(body))) as Answer<Project>

      expect(created.status).toBe(201)
      expect(created.headers.get('Location')).toBe(`/api/v1/projects/${created.body.id}`)
      expect(created.body).toMatchObject({
        ...fields,
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
    },
  )

  it.each(invalidProjectCases)('answers 422 for $name', async ({ body, errors }) => {
    expect(await post('/api/v1/projects', body)).toMatchObject({ status: 422, body: { errors } })
  })

  it.each(createProjectScenarioCases)('answers $name', async ({ address, answer }) => {
    openPage(address)

    expect(await post('/api/v1/projects', '{"name": "Clinic booking"}')).toMatchObject(answer)
  })
})

describe('PATCH /projects/{project_id}', () => {
  it.each(projectStatusChangeCases)('$name', async ({ projectId, status }) => {
    const path = `/api/v1/projects/${projectId}`

    expect(await send('PATCH', path, JSON.stringify({ status }))).toMatchObject({
      status: 200,
      body: { id: projectId, status },
    })
    expect(await listedIds(`status=${status}`)).toContain(projectId)
  })

  it('renames a project, without the spaces around its name', async () => {
    const path = `/api/v1/projects/${projectIds.mentor}`

    expect(await send('PATCH', path, '{"name": " Mentor finder "}')).toMatchObject({
      status: 200,
      body: { name: 'Mentor finder', status: 'active' },
    })
    expect(await call(path)).toMatchObject({ body: { name: 'Mentor finder' } })
  })

  it.each(invalidProjectChangeCases)('answers 422 for $name', async ({ body, errors }) => {
    const path = `/api/v1/projects/${projectIds.mentor}`

    expect(await send('PATCH', path, body)).toMatchObject({ status: 422, body: { errors } })
  })
})

describe('DELETE /projects/{project_id}', () => {
  it('removes a project whose runs ended from the lists and from its address', async () => {
    const path = `/api/v1/projects/${projectIds.campus}`

    expect((await call(path, { method: 'DELETE' })).status).toBe(204)
    expect((await call(path)).status).toBe(404)
    expect(await listedIds('status=active')).not.toContain(projectIds.campus)
  })

  it('keeps a project with a run that is not finished', async () => {
    const path = `/api/v1/projects/${projectIds.mentor}`

    expect(await call(path, { method: 'DELETE' })).toMatchObject({
      status: 409,
      body: { code: 'invalid_state' },
    })
    expect((await call(path)).status).toBe(200)
  })
})

describe('scenarios that never answer', () => {
  it.each(pendingProjectCases)('never answers $request', async ({ address, send }) => {
    openPage(address)
    const body = send.method === 'POST' ? '{}' : null
    const first = await Promise.race([
      call(send.path, { method: send.method, body }).then(() => 'answered'),
      new Promise((resolve) => setTimeout(resolve, 100, 'pending')),
    ])

    expect(first).toBe('pending')
  })
})

describe('errors', () => {
  it.each(projectErrorCases)(
    'answers $status to $request',
    async ({ address, method, path, status, code }) => {
      openPage(address)

      expect(await call(path, { method })).toMatchObject({ status, body: { code } })
    },
  )
})
