import { expect } from '@playwright/test'

import { type ApiPage, expectOk, expectPage, expectProblem } from '../../shared/api'
import { test } from '../../shared/fixtures.utils'
import { reviewNodes } from '../../shared/reviews.constants'
import { finishedArtifactKinds, idea, traceReads } from './artifacts-backend.data'

test('leaves the artifacts of every stage in the project when the run ends', async ({ api }) => {
  const { projectId } = await api.startFinishedRun(idea)

  const artifacts = await api.listArtifacts(projectId)

  expect(artifacts.map((artifact) => artifact.kind)).toEqual(
    expect.arrayContaining(finishedArtifactKinds),
  )
})

test('lists the items of a kind of the project, ordered by key', async ({ api, client }) => {
  const { projectId } = await api.startFinishedRun(idea)

  const page = expectPage(
    await client.get<ApiPage<{ kind: string; key: string }>>(`/projects/${projectId}/items`, {
      kind: 'persona',
      limit: 50,
    }),
  )

  expect(page.items.length).toBeGreaterThan(0)
  expect(page.items.every((item) => item.kind === 'persona')).toBe(true)
  const keys = page.items.map((item) => item.key)
  expect(keys).toEqual([...keys].sort())
})

test('keeps each version of an item that the user edited', async ({ api, client }) => {
  const { run } = await api.startRun(idea, { reviews: [reviewNodes.analysis] })
  const review = await api.waitForReview(run.id)
  const [artifact] = review.review_artifacts
  const items = await api.listItems(artifact?.artifact_id ?? '')
  const target = items.find((item) => item.kind === 'analyzed_requirement')
  if (target === undefined) throw new Error('The analysis has no requirement to edit.')

  const edited = expectOk(await api.editItem(target, { statement: 'Rewritten by the user.' }))

  const revisions = expectPage(
    await client.get<ApiPage<{ version: number }>>(`/items/${target.id}/revisions`),
  )
  expect(revisions.items.map((revision) => revision.version)).toEqual(
    expect.arrayContaining([target.version, edited.version]),
  )
  const old = expectOk(
    await client.get<{ content: Record<string, unknown> }>(`/items/${target.id}`, {
      version: target.version,
    }),
  )
  expect(old.content.statement).toBe(target.content.statement)
  const latest = expectOk(
    await client.get<{ content: Record<string, unknown> }>(`/items/${target.id}`),
  )
  expect(latest.content.statement).toBe('Rewritten by the user.')
})

for (const { name, path, field } of traceReads) {
  test(`reads ${name} of the traceability of a finished project`, async ({ api, client }) => {
    const { projectId } = await api.startFinishedRun(idea)

    const read = expectOk(
      await client.get<Record<string, unknown>>(`/projects/${projectId}/${path}`),
    )

    expect(read).toHaveProperty(field)
  })
}

test('answers 404 for an item and an artifact that do not exist', async ({ client }) => {
  const missing = '00000000-0000-4000-8000-000000000000'

  expectProblem(await client.get(`/items/${missing}`), 404, 'not_found')
  expectProblem(await client.get(`/artifacts/${missing}`), 404, 'not_found')
})
