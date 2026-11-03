import { describe, expect, it } from 'vitest'

import { HttpStatus } from '@/shared/api/http'
import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import { createTraceLink, deleteTraceLink, listProjectTraceLinks } from '../trace-links.api'
import { apiErrorCases, newLink, projectId, sentRequestCases } from './trace-links.api.data'

describe('trace links api', () => {
  it('lists the links of a project narrowed by the type and the source', async () => {
    const all = await listProjectTraceLinks(projectId, null, 200)
    const derived = await listProjectTraceLinks(projectId, null, 200, { linkType: 'derived_from' })
    const sourceId = derived.items[0]?.source_item_id
    const ofSource = await listProjectTraceLinks(projectId, null, 200, { sourceItemId: sourceId })

    expect(derived.items.length).toBeGreaterThan(0)
    expect(derived.items.length).toBeLessThan(all.items.length)
    expect(derived.items.every(({ link_type }) => link_type === 'derived_from')).toBe(true)
    expect(ofSource.items.every(({ source_item_id }) => source_item_id === sourceId)).toBe(true)
  })

  it('makes a link that the next read lists', async () => {
    const link = await createTraceLink(projectId, newLink)

    const page = await listProjectTraceLinks(projectId, null, 200, { linkType: 'depends_on' })

    expect(link).toMatchObject({
      source_item_id: newLink.source_item_id,
      target_item_id: newLink.target_item_id,
      link_type: 'depends_on',
      note: newLink.note,
    })
    expect(page.items.map(({ id }) => id)).toContain(link.id)
  })

  it('leaves a removed link out of the next read', async () => {
    const link = await createTraceLink(projectId, newLink)

    await deleteTraceLink(link.id)

    const page = await listProjectTraceLinks(projectId, null, 200, { linkType: 'depends_on' })
    expect(page.items.map(({ id }) => id)).not.toContain(link.id)
  })

  it('does not find a link that was removed again', async () => {
    const link = await createTraceLink(projectId, newLink)
    await deleteTraceLink(link.id)

    await expect(deleteTraceLink(link.id)).rejects.toMatchObject({ status: HttpStatus.NotFound })
  })

  itSendsRequests(sentRequestCases)

  itThrowsApiErrors(apiErrorCases)
})
