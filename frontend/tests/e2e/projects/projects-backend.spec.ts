import { expect } from '@playwright/test'

import {
  type ApiPage,
  expectNoContent,
  expectOk,
  expectPage,
  expectProblem,
} from '../../shared/api'
import { seededProjects } from '../../shared/backend-env.constants'
import { test } from '../../shared/fixtures.utils'
import { idea } from '../runs/runs-backend.data'
import { badCursors, emptyPages, pagedLists, projectFilters } from './projects-backend.data'

test('lists the projects of the seed and opens the one that is done', async ({ page, user }) => {
  const { mentor, campus } = seededProjects
  await page.goto('/projects')

  const row = page.getByRole('row', { name: new RegExp(mentor.name) })
  await user.expectRole('cell', mentor.status, row)
  await user.expectRole('link', campus.name)
  await user.pressLink(mentor.name)

  await user.expectUrl(new RegExp(`/projects/${mentor.id}/activity$`))
  await user.expectRunStatus('Done')
})

for (const { name, path, limit } of pagedLists) {
  test(`pages the ${name} with cursors that the API gives`, async ({ api, client }) => {
    const { threadId, run } = await api.startRun(idea)
    await api.waitForRun(run.id, ['succeeded'])
    const address = path.replace(':run', run.id).replace(':thread', threadId)

    const first = expectPage(await client.get<ApiPage<{ id: string }>>(address, { limit }))
    expect(first.next_cursor).not.toBeNull()
    const second = expectPage(
      await client.get<ApiPage<{ id: string }>>(address, {
        limit,
        cursor: first.next_cursor ?? '',
      }),
    )

    expect(first.items).toHaveLength(limit)
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id)
  })
}

for (const cursor of badCursors) {
  test(`refuses the cursor ${cursor} that no list gave`, async ({ client }) => {
    expectProblem(await client.get('/projects', { cursor }), 422, 'validation_failed')
  })
}

for (const { name, path, heading } of emptyPages) {
  test(`opens ${name} of a finished project with nothing chosen`, async ({ page, user }) => {
    await page.goto(`/projects/${seededProjects.mentor.id}/${path}`)

    await user.expectRole('heading', heading)
    await user.expectNoRole('alert', /could not be loaded/)
  })
}

test('opens each document of a finished project', async ({ page, user, api }) => {
  const artifacts = await api.listArtifacts(seededProjects.mentor.id)
  expect(artifacts.length).toBeGreaterThan(0)

  for (const artifact of artifacts) {
    await page.goto(`/projects/${seededProjects.mentor.id}/documents/${artifact.id}`)

    await user.expectRole('heading', artifact.title)
    await user.expectNoRole('heading', 'Something went wrong')
  }
})

test('makes a project, changes it, archives it and removes it', async ({ api, client }) => {
  const projectId = await api.createProject('Library kiosk')

  const changed = expectOk(
    await api.updateProject(projectId, { name: 'Library kiosk 2', description: 'Lend books.' }),
  )
  expect(changed.name).toBe('Library kiosk 2')
  expect(changed.description).toBe('Lend books.')
  expectOk(await api.updateProject(projectId, { status: 'archived' }))
  expect((await api.listProjects('active')).map((project) => project.id)).not.toContain(projectId)
  expect((await api.listProjects('archived')).map((project) => project.id)).toContain(projectId)
  expectNoContent(await api.deleteProject(projectId))

  expectProblem(await client.get(`/projects/${projectId}`), 404, 'not_found')
})

test('refuses a project without a name', async ({ client }) => {
  expectProblem(await client.post('/projects', { name: '   ' }), 422, 'validation_failed', 'name')
})

test('answers 404 for a project that does not exist', async ({ client }) => {
  expectProblem(
    await client.get('/projects/00000000-0000-4000-8000-000000000000'),
    404,
    'not_found',
  )
})

for (const { name, archived } of projectFilters) {
  test(`shows a project of ${name} in its own list only`, async ({ api, page, user }) => {
    const projectName = `Filter ${archived ? 'archived' : 'active'} ${Date.now().toString()}`
    const projectId = await api.createProject(projectName)
    if (archived) expectOk(await api.updateProject(projectId, { status: 'archived' }))
    await page.goto('/projects')

    if (archived) {
      await user.expectRole('heading', 'Your projects')
      await user.expectNoRole('link', projectName)
      await user.pressButton('Archived')
      await user.expectRole('link', projectName)
    } else {
      await user.expectRole('link', projectName)
      await user.pressButton('Archived')
      await user.expectNoRole('link', projectName)
    }
  })
}
