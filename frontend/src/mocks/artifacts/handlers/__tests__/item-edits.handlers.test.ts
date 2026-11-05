import { describe, expect, it } from 'vitest'

import type { Artifact, ArtifactItem, OutlineItem, Revision } from '@/modules/artifact/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpStatus } from '@/shared/api/http'
import { callApi, getApiItems } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import {
  analyzedContent,
  analyzedPath,
  itemEditRejectedCases,
  itemVersion,
} from './item-edits.handlers.data'
import { analysis, analysisItems, analyzedRequirement } from './items.handlers.data'

/** The key, outline number and depth of the items of the analysis, in outline order. */
async function outline() {
  return (await getApiItems<OutlineItem>(`${analysisItems}?limit=200`)).map(
    ({ key, outline_number, depth }) => [key, outline_number, depth],
  )
}

async function readItem(path: string) {
  const answer = await callApi({ method: 'GET', path })
  return { status: answer.status, item: answer.body as ArtifactItem }
}

function deleteItem() {
  return callApi({ method: 'DELETE', path: analyzedPath })
}

function restoreFirstVersion() {
  return callApi({ method: 'POST', path: `${analyzedPath}/restore`, body: { version: 1 } })
}

function readAnalysis() {
  return callApi({
    method: 'GET',
    path: apiEndpoints.artifact.path({ artifactId: analysis.id }),
  })
}

/** Saves a change of the first analyzed requirement, based on the version it has. */
function changeFirstItem(body: unknown) {
  return callApi({ method: 'PATCH', path: analyzedPath, body, headers: itemVersion })
}

/** Adds a section to the analysis, at the top level or under another section. */
function addSection(title: string, parentItemId: string | null = null) {
  return callApi({
    method: 'POST',
    path: analysisItems,
    body: { kind: 'section', content: { title, introduction: null }, parent_item_id: parentItemId },
  })
}

/** Adds an analyzed requirement to the analysis, at the top level or under a section. */
function addAnalyzedRequirement(parentItemId: string | null = null) {
  return callApi({
    method: 'POST',
    path: analysisItems,
    body: {
      kind: 'analyzed_requirement',
      content: analyzedContent,
      parent_item_id: parentItemId,
    },
  })
}

describe('the item edit handlers', () => {
  itRejectsRequests(itemEditRejectedCases)

  it('give a change a new version, and keep the earlier version readable', async () => {
    const saved = await changeFirstItem({
      content: { title: 'List mentors fast' },
      review_status: 'rejected',
    })

    expect(saved.body).toMatchObject({
      version: analyzedRequirement.version + 1,
      review_status: 'rejected',
      content: { title: 'List mentors fast', statement: analyzedRequirement.content.statement },
      updated_by: { actor: 'user' },
    })
    expect(
      (await readItem(`${analyzedPath}?version=${String(analyzedRequirement.version)}`)).item
        .content.title,
    ).toBe(analyzedRequirement.content.title)
    const revisions = await getApiItems<Revision>(`${analyzedPath}/revisions`)
    expect(revisions[0]).toMatchObject({
      version: analyzedRequirement.version + 1,
      change_reason: 'user_edit',
    })
  })

  it('make an old version current again as a new version', async () => {
    await changeFirstItem({ content: { title: 'List mentors fast' } })

    const restored = await restoreFirstVersion()

    expect(restored.body).toMatchObject({
      version: analyzedRequirement.version + 2,
      content: { title: analyzedRequirement.content.title },
    })
  })

  it('make an item last under its parent, with the next key of its kind', async () => {
    const section = (await addSection('Findings')).body as ArtifactItem

    const created = await addAnalyzedRequirement(section.id)

    expect(created.status).toBe(HttpStatus.Created)
    expect(created.body).toMatchObject({
      key: 'AR-011',
      version: 1,
      review_status: 'draft',
      position: 1,
      outline_number: '29.1',
      created_by: { actor: 'user' },
    })
    const id = (created.body as ArtifactItem).id
    expect(created.headers.get(HttpHeader.Location)).toBe(apiEndpoints.item.path({ itemId: id }))
    expect((await outline()).slice(-2)).toEqual([
      ['SEC-008', '29', 1],
      ['AR-011', '29.1', 2],
    ])
    const revisions = await getApiItems<Revision>(apiEndpoints.itemRevisions.path({ itemId: id }))
    expect(revisions.map(({ version, change_reason }) => [version, change_reason])).toEqual([
      [1, 'user_edit'],
    ])
  })

  it.each([
    {
      name: 'add an item',
      request: {
        method: 'POST',
        path: analysisItems,
        body: { kind: 'analyzed_requirement', content: analyzedContent },
      },
    },
    {
      name: 'change an item',
      request: {
        method: 'PATCH',
        path: analyzedPath,
        body: { content: { priority: 'must' } },
        headers: itemVersion,
      },
    },
    { name: 'delete an item', request: { method: 'DELETE', path: analyzedPath } },
  ] as const)('give the artifact a new version when you $name', async ({ request }) => {
    await callApi(request)

    const answer = await readAnalysis()

    expect(answer.body).toMatchObject({
      version: analysis.version + 1,
      updated_by: { actor: 'user' },
    })
  })

  it('make an item last after the ones that stay, when one before them was deleted', async () => {
    await deleteItem()

    const created = await addAnalyzedRequirement()

    expect(created.body).toMatchObject({ position: 29 })
  })

  it('count the items of the artifact that is changed', async () => {
    await callApi({
      method: 'POST',
      path: analysisItems,
      body: { kind: 'section', content: { title: 'Appendix', introduction: null } },
    })

    const answer = await readAnalysis()

    expect(answer.body).toMatchObject({ item_count: analysis.item_count + 1 })
  })

  it('leave a deleted item out of the lists, and keep its versions readable', async () => {
    expect((await deleteItem()).status).toBe(HttpStatus.NoContent)

    expect((await readItem(analyzedPath)).status).toBe(HttpStatus.NotFound)
    expect((await outline()).map(([key]) => key)).not.toContain('AR-001')
    expect(
      (await readItem(`${analyzedPath}?version=${String(analyzedRequirement.version)}`)).item.key,
    ).toBe('AR-001')
    const revisions = await getApiItems<Revision>(`${analyzedPath}/revisions`)
    expect(revisions[0]).toMatchObject({ change_reason: 'deleted' })
  })

  it('bring the items back to what they held when a version of the artifact is restored', async () => {
    const original = (await readAnalysis()).body as Artifact
    await changeFirstItem({ content: { title: 'List mentors fast' } })
    const afterFirstEdit = (await readAnalysis()).body as Artifact
    await callApi({
      method: 'PATCH',
      path: analyzedPath,
      body: { content: { title: 'List mentors faster' } },
      headers: { [HttpHeader.IfMatch]: String(analyzedRequirement.version + 1) },
    })
    const restoreArtifact = (version: number) =>
      callApi({
        method: 'POST',
        path: apiEndpoints.artifactRestore.path({ artifactId: analysis.id }),
        body: { version },
      })

    await restoreArtifact(afterFirstEdit.version)
    expect((await readItem(analyzedPath)).item.content.title).toBe('List mentors fast')

    await restoreArtifact(original.version)
    expect((await readItem(analyzedPath)).item.content.title).toBe(
      analyzedRequirement.content.title,
    )
  })

  it('bring a deleted item back when a version is restored', async () => {
    await deleteItem()

    const restored = await restoreFirstVersion()

    expect(restored.status).toBe(HttpStatus.Ok)
    expect((await outline()).map(([key]) => key)).toContain('AR-001')
  })

  it('put the children of a parent in a new order and number them again', async () => {
    const section = (await addSection('Findings')).body as ArtifactItem
    const first = (await addAnalyzedRequirement(section.id)).body as ArtifactItem
    const second = (await addAnalyzedRequirement(section.id)).body as ArtifactItem

    const reordered = await callApi({
      method: 'POST',
      path: `${analysisItems}/reorder`,
      body: { parent_item_id: section.id, ids: [second.id, first.id] },
    })

    expect(reordered.status).toBe(HttpStatus.NoContent)
    expect((await outline()).slice(-3)).toEqual([
      ['SEC-008', '29', 1],
      ['AR-012', '29.1', 2],
      ['AR-011', '29.2', 2],
    ])
  })

  it('move an item under another parent, at a position', async () => {
    const section = (await addSection('Findings')).body as ArtifactItem

    const moved = await callApi({
      method: 'POST',
      path: `${analyzedPath}/move`,
      body: { parent_item_id: section.id, position: 1 },
    })

    expect(moved.body).toMatchObject({
      key: 'AR-001',
      parent_item_id: section.id,
      position: 1,
    })
    const places = await outline()
    expect(places.find(([key]) => key === 'AR-001')).toEqual(['AR-001', '28.1', 2])
    expect(places.find(([key]) => key === 'AR-002')).toEqual(['AR-002', '9', 1])
  })

  it('move an item to the top level when no parent is given', async () => {
    await callApi({
      method: 'POST',
      path: `${analyzedPath}/move`,
      body: { parent_item_id: null, position: 1 },
    })

    expect((await outline())[0]).toEqual(['AR-001', '1', 1])
  })

  it('refuse a deletion of a section that still holds items', async () => {
    const section = (await addSection('Findings')).body as ArtifactItem
    await addAnalyzedRequirement(section.id)

    const deleted = await callApi({
      method: 'DELETE',
      path: apiEndpoints.item.path({ itemId: section.id }),
    })

    expect(deleted).toMatchObject({ status: HttpStatus.Conflict, body: { code: 'invalid_state' } })
  })

  it('refuse a move of a section into itself, or into one of its own sections', async () => {
    const parent = (await addSection('Findings')).body as ArtifactItem
    const child = (await addSection('Interviews', parent.id)).body as ArtifactItem
    const moveSection = (parentItemId: string) =>
      callApi({
        method: 'POST',
        path: `${apiEndpoints.item.path({ itemId: parent.id })}/move`,
        body: { parent_item_id: parentItemId, position: 1 },
      })

    const intoItself = await moveSection(parent.id)
    expect(intoItself).toMatchObject({
      status: HttpStatus.UnprocessableContent,
      body: { code: 'validation_failed' },
    })

    const intoOwnSection = await moveSection(child.id)
    expect(intoOwnSection).toMatchObject({
      status: HttpStatus.UnprocessableContent,
      body: { code: 'validation_failed' },
    })
  })
})
