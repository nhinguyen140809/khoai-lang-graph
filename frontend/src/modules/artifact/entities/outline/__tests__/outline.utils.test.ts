import { describe, expect, it } from 'vitest'

import { itemFixtures } from '@/mocks/artifacts/fixtures/artifacts.fixtures'

import type { ArtifactItem } from '../../items/items.types'
import type { OutlineNode } from '../outline.types'
import { artifactOutline, outlineItemsOf } from '../outline.utils'
import { isBranch, outlineStatuses } from '../outline-path.utils'
import {
  issueKindFixtures,
  kindViewFixtures,
  mentorDocument,
  outlineOf,
} from './outline.utils.data'

function shapeOf(nodes: readonly OutlineNode[]): unknown[] {
  return nodes.map((node) => {
    if (isBranch(node)) {
      return {
        type: node.type,
        title: node.title,
        count: node.count,
        children: shapeOf(node.children),
      }
    }
    return { type: node.type, title: node.title }
  })
}

describe('artifactOutline', () => {
  it('nests the sections and groups the items under them by kind', () => {
    const nodes = outlineOf('requirement_specification')
    const introduction = nodes[0]
    const functional = nodes[2]
    const nonFunctional = nodes[3]

    expect(introduction).toMatchObject({ type: 'section', title: 'Introduction', count: 0 })
    expect(shapeOf(functional === undefined ? [] : [functional])).toEqual([
      {
        type: 'section',
        title: 'Functional requirements',
        count: 7,
        children: [
          {
            type: 'section',
            title: 'Mentor discovery',
            count: 2,
            children: [
              {
                type: 'group',
                title: 'Requirement',
                count: 2,
                children: [expect.anything(), expect.anything()],
              },
            ],
          },
          expect.objectContaining({ title: 'Booking', count: 3 }),
          expect.objectContaining({ title: 'Mentor profile', count: 2 }),
        ],
      },
    ])
    expect(nonFunctional).toMatchObject({ type: 'section', title: 'Non-functional requirements' })
  })

  it('groups the items of a document without sections in the order of the item kinds', () => {
    const groups = outlineOf('requirements_analysis').map(
      (node) => node.type === 'group' && node.kind,
    )

    expect(groups).toEqual([
      'raw_requirement',
      'analyzed_requirement',
      'latent_need',
      'assumption',
      'ambiguity_issue',
      'conflict',
    ])
  })

  it('titles a group with the title of its item kind', () => {
    const [group] = outlineOf('requirements_analysis')

    expect(group).toMatchObject({ type: 'group', title: 'Stated need', count: 8 })
  })

  it('counts the statuses of the items under a group, whatever the review', () => {
    const needs = outlineOf('requirements_analysis').find(
      (node) => node.type === 'group' && node.kind === 'latent_need',
    )

    const counts = needs?.type === 'group' ? needs.statusCounts : []
    expect(counts.map(({ status }) => status)).toContain('draft')
    expect(counts.reduce((sum, { count }) => sum + count, 0)).toBe(
      needs?.type === 'group' ? needs.count : -1,
    )
  })

  it('adds the counts under the sections into the section above', () => {
    const [top] = outlineOf('requirement_specification')
    const total =
      top !== undefined && isBranch(top)
        ? top.statusCounts.reduce((sum, { count }) => sum + count, 0)
        : -1

    expect(total).toBe(top !== undefined && isBranch(top) ? top.count : -2)
  })

  it('gives no row to the items of a kind that is not listed', () => {
    expect(outlineOf('interview_transcript')).toEqual([])
  })

  it('gives one row for each filled field of an artifact without items', () => {
    const rows = outlineOf('elicitation_plan')

    expect(rows.every(({ type }) => type === 'field')).toBe(true)
    expect(rows.map((row) => row.type === 'field' && row.name)).toContain('objectives')
  })

  it('leaves out the fields that are empty', () => {
    const document = mentorDocument('elicitation_plan')

    const rows = artifactOutline({
      ...document,
      artifact: { ...document.artifact, content: { objectives: ['a'], topics: [] } },
      artifactSchema: kindViewFixtures.get('elicitation_plan')?.schema,
      kinds: kindViewFixtures,
      issueKinds: issueKindFixtures,
    })

    expect(rows.map((row) => row.type === 'field' && row.name)).toEqual(['objectives'])
  })

  it('gives nothing for an artifact whose schema is not known', () => {
    const document = mentorDocument('elicitation_plan')

    expect(
      artifactOutline({
        ...document,
        artifactSchema: undefined,
        kinds: kindViewFixtures,
        issueKinds: [],
      }),
    ).toEqual([])
  })
})

describe('outlineItemsOf', () => {
  it('reads a flat read of the items of a document as its outline does, with their depth', () => {
    const document = mentorDocument('requirement_specification')
    // A read of a whole project carries no depth: the outline reads it from the chain of parents.
    const flat = itemFixtures.filter(({ artifact_id }) => artifact_id === document.artifact.id)

    expect(outlineItemsOf(flat)).toEqual(document.items)
  })

  it('leaves the superseded items out', () => {
    const document = mentorDocument('requirement_specification')
    const flat = itemFixtures.filter(({ artifact_id }) => artifact_id === document.artifact.id)
    const [one] = flat
    if (one === undefined) throw new Error('The document has no items')

    const superseded: ArtifactItem = { ...one, id: 'i-superseded', review_status: 'superseded' }
    expect(outlineItemsOf([...flat, superseded])).toEqual(document.items)
  })
})

describe('the out of date items of an outline', () => {
  it('reach the item rows and the counts of the sections and groups', () => {
    const document = mentorDocument('requirement_specification')
    const outOfDate = document.items.find(({ key }) => key === 'REQ-001')
    if (outOfDate === undefined) throw new Error('No REQ-001 in the fixture')

    const nodes = artifactOutline({
      ...document,
      artifactSchema: kindViewFixtures.get('requirement_specification')?.schema,
      kinds: kindViewFixtures,
      issueKinds: issueKindFixtures,
      outOfDateIds: new Set([outOfDate.id]),
    })

    const statuses = outlineStatuses(nodes).filter(
      ({ item }) => item.key === 'REQ-001' || item.key === 'REQ-002',
    )
    expect(statuses.map(({ item, status }) => [item.key, status])).toEqual([
      ['REQ-001', 'outOfDate'],
      ['REQ-002', 'approved'],
    ])
  })
})
