import { describe, expect, it } from 'vitest'

import type { OutlineItem } from '@/modules/artifact/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { getApiItems, openPage } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import { runIds } from '../../../shared/db'
import {
  discoverySection,
  itemRejectedCases,
  projectId,
  specificationItems,
} from './items.handlers.data'

/** An item with the items inside it, as the nested shape gives it. */
interface NestedItem {
  key: string
  outline_number: string
  children: NestedItem[]
}

describe('the item handlers', () => {
  itRejectsRequests(itemRejectedCases)

  it('list the items of an artifact in outline order, narrowed by the filters', async () => {
    const all = await getApiItems<OutlineItem>(specificationItems)
    const sections = await getApiItems<OutlineItem>(`${specificationItems}?kind=section`)
    const inDiscovery = await getApiItems<OutlineItem>(
      `${specificationItems}?parent_item_id=${discoverySection.id}`,
    )

    expect(all[0]).toMatchObject({ key: 'SEC-001', outline_number: '1', depth: 1 })
    expect(sections.every(({ kind }) => kind === 'section')).toBe(true)
    expect(inDiscovery.map(({ key }) => key)).toEqual(['REQ-001', 'REQ-002'])
  })

  it('nest the children under their parent in the nested shape', async () => {
    const tree = await getApiItems<NestedItem>(`${specificationItems}?shape=tree`)

    const functional = tree.find(({ key }) => key === 'SEC-003')
    expect(functional?.outline_number).toBe('3')
    const discovery = functional?.children.find(({ key }) => key === 'SEC-004')
    expect(discovery?.outline_number).toBe('3.1')
    expect(discovery?.children.map(({ key }) => key)).toEqual(['REQ-001', 'REQ-002'])
  })

  it('list the items of a project by key, narrowed by the filters', async () => {
    const byRun = await getApiItems<OutlineItem>(
      `${apiEndpoints.projectItems.path({ projectId })}?run_id=${runIds.mentorMain3}&limit=5`,
    )
    const byOtherRun = await getApiItems<OutlineItem>(
      `${apiEndpoints.projectItems.path({ projectId })}?run_id=another`,
    )
    const byText = await getApiItems<OutlineItem>(
      `${apiEndpoints.projectItems.path({ projectId })}?q=search%20mentors&kind=spec_requirement`,
    )

    expect(byRun.length).toBeGreaterThan(0)
    expect(byOtherRun).toEqual([])
    expect(byText.map(({ key }) => key)).toContain('REQ-001')
    expect(byText.map(({ key }) => key)).toEqual([...byText.map(({ key }) => key)].sort())
  })

  it('list no item of a project in the empty scenario', async () => {
    openPage('/?mock-items=empty')

    expect(await getApiItems<OutlineItem>(apiEndpoints.projectItems.path({ projectId }))).toEqual(
      [],
    )
  })
})
