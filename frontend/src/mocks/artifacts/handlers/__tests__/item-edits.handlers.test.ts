import { describe, expect, it } from 'vitest'

import type { Artifact, ArtifactItem, OutlineItem, Revision } from '@/modules/artifact/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpStatus } from '@/shared/api/http'
import { callApi, getApiItems } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import {
  backlogContent,
  backlogItemCases,
  backlogItems,
  bookingSection,
  itemEditRejectedCases,
  itemVersion,
  requirementContent,
  siblingRequirement,
} from './item-edits.handlers.data'
import {
  discoverySection,
  itemPath,
  mentorRequirement,
  specification,
  specificationItems,
} from './items.handlers.data'

/** The key, outline number and depth of the items of the specification, in outline order. */
async function outline() {
  return (await getApiItems<OutlineItem>(`${specificationItems}?limit=200`)).map(
    ({ key, outline_number, depth }) => [key, outline_number, depth],
  )
}

/** The places from the item with the key `from` up to the one with the key `to`, both included. */
function between(places: (string | number | null)[][], from: string, to: string) {
  const keys = places.map(([key]) => key)
  return places.slice(keys.indexOf(from), keys.indexOf(to) + 1)
}

async function readItem(path: string) {
  const answer = await callApi({ method: 'GET', path })
  return { status: answer.status, item: answer.body as ArtifactItem }
}

function deleteItem() {
  return callApi({ method: 'DELETE', path: itemPath })
}

function restoreFirstVersion() {
  return callApi({ method: 'POST', path: `${itemPath}/restore`, body: { version: 1 } })
}

function readSpecification() {
  return callApi({
    method: 'GET',
    path: apiEndpoints.artifact.path({ artifactId: specification.id }),
  })
}

/** Saves a change of the first requirement, based on the version it has. */
function changeFirstItem(body: unknown) {
  return callApi({ method: 'PATCH', path: itemPath, body, headers: itemVersion })
}

/** Adds a requirement last under the section Mentor discovery. */
function addRequirementToDiscovery() {
  return callApi({
    method: 'POST',
    path: specificationItems,
    body: {
      kind: 'spec_requirement',
      content: requirementContent,
      parent_item_id: discoverySection.id,
    },
  })
}

describe('the item edit handlers', () => {
  itRejectsRequests(itemEditRejectedCases)

  it('give a change a new version, and keep the earlier version readable', async () => {
    const saved = await changeFirstItem({
      content: { title: 'Find mentors' },
      review_status: 'rejected',
    })

    expect(saved.body).toMatchObject({
      version: mentorRequirement.version + 1,
      review_status: 'rejected',
      content: { title: 'Find mentors', statement: mentorRequirement.content.statement },
      updated_by: { actor: 'user' },
    })
    expect(
      (await readItem(`${itemPath}?version=${String(mentorRequirement.version)}`)).item.content
        .title,
    ).toBe(mentorRequirement.content.title)
    const revisions = await getApiItems<Revision>(`${itemPath}/revisions`)
    expect(revisions[0]).toMatchObject({
      version: mentorRequirement.version + 1,
      change_reason: 'user_edit',
    })
  })

  it('make an old version current again as a new version', async () => {
    await changeFirstItem({ content: { title: 'Find mentors' } })

    const restored = await restoreFirstVersion()

    expect(restored.body).toMatchObject({
      version: mentorRequirement.version + 2,
      content: { title: mentorRequirement.content.title },
    })
  })

  it('make an item last under its parent, with the next key of its kind', async () => {
    const created = await addRequirementToDiscovery()

    expect(created.status).toBe(HttpStatus.Created)
    expect(created.body).toMatchObject({
      key: 'REQ-011',
      version: 1,
      review_status: 'draft',
      position: 3,
      outline_number: '3.1.3',
      created_by: { actor: 'user' },
    })
    const id = (created.body as ArtifactItem).id
    expect(created.headers.get(HttpHeader.Location)).toBe(apiEndpoints.item.path({ itemId: id }))
    expect(between(await outline(), 'SEC-004', 'SEC-005').map(([key]) => key)).toEqual([
      'SEC-004',
      'REQ-001',
      'REQ-002',
      'REQ-011',
      'SEC-005',
    ])
    const revisions = await getApiItems<Revision>(apiEndpoints.itemRevisions.path({ itemId: id }))
    expect(revisions.map(({ version, change_reason }) => [version, change_reason])).toEqual([
      [1, 'user_edit'],
    ])
  })

  it.each(backlogItemCases)(
    'key $name of the backlog by its own prefix',
    async ({ itemType, key }) => {
      const created = await callApi({
        method: 'POST',
        path: backlogItems,
        body: { kind: 'backlog_item', content: { ...backlogContent, item_type: itemType } },
      })

      expect(created.status).toBe(HttpStatus.Created)
      expect(created.body).toMatchObject({ key })
    },
  )

  it.each([
    {
      name: 'add an item',
      request: {
        method: 'POST',
        path: specificationItems,
        body: { kind: 'spec_requirement', content: requirementContent },
      },
    },
    {
      name: 'change an item',
      request: {
        method: 'PATCH',
        path: itemPath,
        body: { content: { priority: 'must' } },
        headers: itemVersion,
      },
    },
    { name: 'delete an item', request: { method: 'DELETE', path: itemPath } },
  ] as const)('give the artifact a new version when you $name', async ({ request }) => {
    await callApi(request)

    const answer = await readSpecification()

    expect(answer.body).toMatchObject({
      version: specification.version + 1,
      updated_by: { actor: 'user' },
    })
  })

  it('make an item last after the ones that stay, when one before them was deleted', async () => {
    await deleteItem()

    const created = await addRequirementToDiscovery()

    expect(created.body).toMatchObject({ position: 3 })
  })

  it('count the items of the artifact that is changed', async () => {
    await callApi({
      method: 'POST',
      path: specificationItems,
      body: { kind: 'section', content: { title: 'Appendix', introduction: null } },
    })

    const answer = await readSpecification()

    expect(answer.body).toMatchObject({ item_count: specification.item_count + 1 })
  })

  it('leave a deleted item out of the lists, and keep its versions readable', async () => {
    expect((await deleteItem()).status).toBe(HttpStatus.NoContent)

    expect((await readItem(itemPath)).status).toBe(HttpStatus.NotFound)
    expect((await outline()).map(([key]) => key)).not.toContain('REQ-001')
    expect(
      (await readItem(`${itemPath}?version=${String(mentorRequirement.version)}`)).item.key,
    ).toBe('REQ-001')
    const revisions = await getApiItems<Revision>(`${itemPath}/revisions`)
    expect(revisions[0]).toMatchObject({ change_reason: 'deleted' })
  })

  it('bring the items back to what they held when a version of the artifact is restored', async () => {
    const original = (await readSpecification()).body as Artifact
    await changeFirstItem({ content: { title: 'Find mentors' } })
    const afterFirstEdit = (await readSpecification()).body as Artifact
    await callApi({
      method: 'PATCH',
      path: itemPath,
      body: { content: { title: 'Find mentors fast' } },
      headers: { [HttpHeader.IfMatch]: String(mentorRequirement.version + 1) },
    })
    const restoreArtifact = (version: number) =>
      callApi({
        method: 'POST',
        path: apiEndpoints.artifactRestore.path({ artifactId: specification.id }),
        body: { version },
      })

    await restoreArtifact(afterFirstEdit.version)
    expect((await readItem(itemPath)).item.content.title).toBe('Find mentors')

    await restoreArtifact(original.version)
    expect((await readItem(itemPath)).item.content.title).toBe(mentorRequirement.content.title)
  })

  it('bring a deleted item back when a version is restored', async () => {
    await deleteItem()

    const restored = await restoreFirstVersion()

    expect(restored.status).toBe(HttpStatus.Ok)
    expect((await outline()).map(([key]) => key)).toContain('REQ-001')
  })

  it('put the children of a parent in a new order and number them again', async () => {
    const reordered = await callApi({
      method: 'POST',
      path: `${specificationItems}/reorder`,
      body: {
        parent_item_id: discoverySection.id,
        ids: [siblingRequirement.id, mentorRequirement.id],
      },
    })

    expect(reordered.status).toBe(HttpStatus.NoContent)
    expect(between(await outline(), 'SEC-004', 'SEC-005')).toEqual([
      ['SEC-004', '3.1', 2],
      ['REQ-002', '3.1.1', 3],
      ['REQ-001', '3.1.2', 3],
      ['SEC-005', '3.2', 2],
    ])
  })

  it('move an item under another parent, at a position', async () => {
    const moved = await callApi({
      method: 'POST',
      path: `${itemPath}/move`,
      body: { parent_item_id: bookingSection.id, position: 1 },
    })

    expect(moved.body).toMatchObject({
      key: 'REQ-001',
      parent_item_id: bookingSection.id,
      position: 1,
    })
    const places = await outline()
    expect(places.find(([key]) => key === 'REQ-001')).toEqual(['REQ-001', '3.2.1', 3])
    expect(places.find(([key]) => key === 'REQ-002')).toEqual(['REQ-002', '3.1.1', 3])
  })

  it('move an item to the top level when no parent is given', async () => {
    await callApi({
      method: 'POST',
      path: `${itemPath}/move`,
      body: { parent_item_id: null, position: 1 },
    })

    expect((await outline())[0]).toEqual(['REQ-001', '1', 1])
  })
})
