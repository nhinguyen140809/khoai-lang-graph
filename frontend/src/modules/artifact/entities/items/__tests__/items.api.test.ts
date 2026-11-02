import { describe, expect, it, vi } from 'vitest'

import { HttpHeader, HttpStatus } from '@/shared/api/http'
import { recordRequests } from '@/test/msw'
import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import {
  createItem,
  deleteItem,
  getItem,
  listArtifactItems,
  listNestedArtifactItems,
  listProjectItems,
  updateItem,
} from '../items.api'
import {
  apiErrorCases,
  newRequirement,
  requirement,
  sentRequestCases,
  specification,
} from './items.api.data'

describe('items api', () => {
  it('lists the items of an artifact in outline order, with their depth', async () => {
    const page = await listArtifactItems(specification.id, null, 200)

    expect(page.items[0]).toMatchObject({ key: 'SEC-001', depth: 1, outline_number: '1' })
    expect(page.items.find(({ key }) => key === 'REQ-001')).toMatchObject({ depth: 3 })
    expect(page.next_cursor).toBeNull()
  })

  it('lists the items of an artifact with the items inside each one as its children', async () => {
    const page = await listNestedArtifactItems(specification.id, null, 200)

    const functional = page.items.find(({ key }) => key === 'SEC-003')
    const discovery = functional?.children.find(({ key }) => key === 'SEC-004')
    expect(discovery?.outline_number).toBe('3.1')
    expect(discovery?.children.map(({ key }) => key)).toEqual(['REQ-001', 'REQ-002'])
  })

  it('lists the next page of the items of an artifact', async () => {
    const first = await listArtifactItems(specification.id, null, 2)
    const second = await listArtifactItems(specification.id, first.next_cursor, 2)

    expect(first.items).toHaveLength(2)
    expect(second.items.map(({ id }) => id)).not.toContain(first.items[0]?.id)
  })

  it('lists the items of a project that match the filters', async () => {
    const page = await listProjectItems(requirement.project_id, null, 50, {
      kind: 'spec_requirement',
      text: 'req-001',
    })

    expect(page.items.map(({ key }) => key)).toEqual(['REQ-001'])
  })

  it('reads an item as it was at an older version', async () => {
    const edited = await updateItem(requirement.id, requirement.version, {
      content: { title: 'Find mentors' },
    })

    const older = await getItem(requirement.id, requirement.version)

    expect(older.content.title).toBe(requirement.content.title)
    expect(edited.content.title).toBe('Find mentors')
  })

  it('makes an item that gets the next key of its kind', async () => {
    const created = await createItem(specification.id, newRequirement)

    expect(created).toMatchObject({ kind: 'spec_requirement', version: 1, review_status: 'draft' })
    expect(created.key).toMatch(/^REQ-0\d\d$/)
  })

  it('does not find a deleted item again', async () => {
    await deleteItem(requirement.id)

    await expect(getItem(requirement.id)).rejects.toMatchObject({ status: HttpStatus.NotFound })
  })

  itSendsRequests(sentRequestCases)

  it('sends the version that a change is based on in If-Match', async () => {
    const requests = recordRequests([HttpHeader.IfMatch])

    await updateItem(requirement.id, requirement.version, { content: { title: 'x' } })

    await vi.waitFor(() => {
      expect(requests[0]?.headers).toEqual({ [HttpHeader.IfMatch]: String(requirement.version) })
    })
  })

  itThrowsApiErrors(apiErrorCases)
})
