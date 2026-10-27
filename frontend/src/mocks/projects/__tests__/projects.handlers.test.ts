import { describe, expect, it } from 'vitest'

import type { Project } from '@/modules/project/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpStatus } from '@/shared/api/http'
import type { ListPage } from '@/shared/api/request'
import type { ApiAnswer } from '@/test/msw'
import { fetchApi, openPage, patchApi, postApi } from '@/test/msw'
import { expectStillPending } from '@/test/steps'
import { itRejectsRequests } from '@/test/suites'

import { projectIds } from '../../shared/db'
import {
  createProjectCases,
  pendingProjectCases,
  projectErrorCases,
  projectFilterCases,
  projectListCases,
  projectRejectedCases,
  projectStatusChangeCases,
  rollupRunStatusCases,
  unfinishedRunCountCases,
} from './projects.handlers.data'

async function listedIds(query: string) {
  const { body } = (await fetchApi(
    `${apiEndpoints.projects.path()}?${query}&limit=200`,
  )) as ApiAnswer<ListPage<Project>>
  return body.items.map(({ id }) => id)
}

describe('GET /projects', () => {
  it.each(projectListCases)('answers $name', async ({ address, query, count, nextCursor }) => {
    openPage(address)

    const { status, body } = (await fetchApi(
      `${apiEndpoints.projects.path()}${query}`,
    )) as ApiAnswer<ListPage<Project>>

    expect(status).toBe(HttpStatus.Ok)
    expect(body.items).toHaveLength(count)
    expect(body.next_cursor).toBe(nextCursor)
  })

  it('lists the latest activity first', async () => {
    const { body } = (await fetchApi(apiEndpoints.projects.path())) as ApiAnswer<ListPage<Project>>

    const times = body.items.map(({ last_activity_at }) => last_activity_at)
    expect(times).toEqual(times.toSorted().reverse())
  })

  it.each(projectFilterCases)('filters by $name', async ({ query, keeps }) => {
    const all = (await fetchApi(`${apiEndpoints.projects.path()}?limit=200`)) as ApiAnswer<
      ListPage<Project>
    >
    const { body } = (await fetchApi(
      `${apiEndpoints.projects.path()}${query}&limit=200`,
    )) as ApiAnswer<ListPage<Project>>

    expect(body.items.length).toBeGreaterThan(0)
    expect(body.items.length).toBeLessThan(all.body.items.length)
    expect(body.items.every(keeps)).toBe(true)
  })

  it('filters by status', async () => {
    const { body } = (await fetchApi(
      `${apiEndpoints.projects.path()}?status=archived`,
    )) as ApiAnswer<ListPage<Project>>

    expect(body.items.length).toBeGreaterThan(0)
    expect(body.items.every(({ status }) => status === 'archived')).toBe(true)
    expect(body.items.map(({ id }) => id)).toContain(projectIds.laundry)
  })

  it.each(unfinishedRunCountCases)(
    'counts the unfinished runs of $name',
    async ({ address, projectId, counts }) => {
      openPage(address)

      const { body } = (await fetchApi(apiEndpoints.projects.path())) as ApiAnswer<
        ListPage<Project>
      >

      expect(body.items.find(({ id }) => id === projectId)?.unfinished_run_counts).toEqual(counts)
    },
  )
})

describe('the rollup run status of a project', () => {
  it.each(rollupRunStatusCases)(
    'is in GET /projects for $name',
    async ({ address, projectId, status }) => {
      openPage(address)

      const { body } = (await fetchApi(apiEndpoints.projects.path())) as ApiAnswer<
        ListPage<Project>
      >

      expect(body.items.find(({ id }) => id === projectId)?.rollup_run_status).toBe(status)
    },
  )
})

describe('GET /projects/{project_id}', () => {
  it('answers one project, with its unfinished runs', async () => {
    const { status, body } = (await fetchApi(
      apiEndpoints.project.path({ projectId: projectIds.mentor }),
    )) as ApiAnswer<Project>

    expect(status).toBe(HttpStatus.Ok)
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
      const created = (await postApi(apiEndpoints.projects.path(), body)) as ApiAnswer<Project>

      expect(created.status).toBe(HttpStatus.Created)
      expect(created.headers.get(HttpHeader.Location)).toBe(
        apiEndpoints.project.path({ projectId: created.body.id }),
      )
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
      expect(
        (await fetchApi(apiEndpoints.project.path({ projectId: created.body.id }))).status,
      ).toBe(HttpStatus.Ok)
      const list = (await fetchApi(apiEndpoints.projects.path())) as ApiAnswer<ListPage<Project>>
      expect(list.body.items[0]?.id).toBe(created.body.id)
    },
  )
})

describe('PATCH /projects/{project_id}', () => {
  it.each(projectStatusChangeCases)('$name', async ({ projectId, status }) => {
    const path = apiEndpoints.project.path({ projectId })

    expect(await patchApi(path, { status })).toMatchObject({
      status: HttpStatus.Ok,
      body: { id: projectId, status },
    })
    expect(await listedIds(`status=${status}`)).toContain(projectId)
  })

  it('renames a project, without the spaces around its name', async () => {
    const path = apiEndpoints.project.path({ projectId: projectIds.mentor })

    expect(await patchApi(path, '{"name": " Mentor finder "}')).toMatchObject({
      status: HttpStatus.Ok,
      body: { name: 'Mentor finder', status: 'active' },
    })
    expect(await fetchApi(path)).toMatchObject({ body: { name: 'Mentor finder' } })
  })
})

describe('the requests that are refused', () => {
  itRejectsRequests(projectRejectedCases)
})

describe('DELETE /projects/{project_id}', () => {
  it('removes a project whose runs ended from the lists and from its address', async () => {
    const path = apiEndpoints.project.path({ projectId: projectIds.campus })

    expect((await fetchApi(path, { method: 'DELETE' })).status).toBe(HttpStatus.NoContent)
    expect((await fetchApi(path)).status).toBe(HttpStatus.NotFound)
    expect(await listedIds('status=active')).not.toContain(projectIds.campus)
  })

  it('keeps a project with a run that is not finished', async () => {
    const path = apiEndpoints.project.path({ projectId: projectIds.mentor })

    expect(await fetchApi(path, { method: 'DELETE' })).toMatchObject({
      status: HttpStatus.Conflict,
      body: { code: 'invalid_state' },
    })
    expect((await fetchApi(path)).status).toBe(HttpStatus.Ok)
  })
})

describe('scenarios that never answer', () => {
  it.each(pendingProjectCases)('never answers $request', async ({ address, send }) => {
    openPage(address)
    const body = send.method === 'POST' ? '{}' : null
    await expectStillPending(fetchApi(send.path, { method: send.method, body }))
  })
})

describe('errors', () => {
  it.each(projectErrorCases)(
    'answers $status to $request',
    async ({ address, method, path, status, code }) => {
      openPage(address)

      expect(await fetchApi(path, { method })).toMatchObject({ status, body: { code } })
    },
  )
})
