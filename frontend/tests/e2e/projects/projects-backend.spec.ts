import { expect } from '@playwright/test'

import { type ApiPage, expectPage, expectProblem } from '../../shared/api'
import { seededProjects } from '../../shared/backend-env.constants'
import { test } from '../../shared/fixtures.utils'
import { idea } from '../runs/runs-backend.data'
import { badCursors, emptyPages, pagedLists } from './projects-backend.data'

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
