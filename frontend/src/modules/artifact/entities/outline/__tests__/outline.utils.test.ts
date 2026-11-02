import { describe, expect, it } from 'vitest'

import { assertPresent } from '@/shared/lib/guards'

import { documentBlocks } from '../document-blocks.utils'
import type { OutlineNode } from '../outline.types'
import {
  artifactOutline,
  isBranch,
  outlineBreadcrumb,
  outlineNeighbors,
  outlineSequence,
} from '../outline.utils'
import { issueKindFixtures, kindViewFixtures, mentorDocument } from './outline.utils.data'

function outlineOf(kind: string): OutlineNode[] {
  const document = mentorDocument(kind)
  return artifactOutline({
    ...document,
    artifactSchema: kindViewFixtures.get(kind)?.schema,
    kinds: kindViewFixtures,
    issueKinds: issueKindFixtures,
  })
}

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

describe('outlineSequence', () => {
  it('goes through the items across the sections, in order', () => {
    const keys = outlineSequence(outlineOf('requirement_specification')).map(({ key }) => key)
    const expected = mentorDocument('requirement_specification')
      .items.filter(({ kind }) => kind === 'spec_requirement')
      .map(({ key }) => key)

    expect(keys).toHaveLength(expected.length)
    expect(new Set(keys)).toEqual(new Set(expected))
  })

  it('goes through no item of a kind that is not listed', () => {
    expect(outlineSequence(outlineOf('interview_transcript'))).toEqual([])
  })
})

describe('outlineNeighbors', () => {
  const nodes = outlineOf('requirement_specification')
  const sequence = outlineSequence(nodes)

  it('gives the place of an item, with the item before and the one after it', () => {
    const [first, second, third] = sequence

    expect(outlineNeighbors(nodes, second?.id ?? '')).toEqual({
      index: 2,
      count: sequence.length,
      previous: first,
      next: third,
    })
  })

  it('gives no previous item to the first, and no next item to the last', () => {
    expect(outlineNeighbors(nodes, sequence[0]?.id ?? '')).toMatchObject({
      index: 1,
      previous: null,
    })
    expect(outlineNeighbors(nodes, sequence.at(-1)?.id ?? '')).toMatchObject({
      index: sequence.length,
      next: null,
    })
  })

  it('gives the place 0 and no neighbor to an item that is not in the outline', () => {
    expect(outlineNeighbors(nodes, 'missing')).toEqual({
      index: 0,
      count: sequence.length,
      previous: null,
      next: null,
    })
  })
})

describe('outlineBreadcrumb', () => {
  const document = mentorDocument('requirement_specification')
  const outline = { items: document.items, kinds: kindViewFixtures }
  const itemOf = (key: string) =>
    assertPresent(
      document.items.find((candidate) => candidate.key === key),
      `No item ${key}`,
    )

  it('gives the sections above an item from the top down, then the group of its kind', () => {
    expect(outlineBreadcrumb(itemOf('REQ-001'), outline).map(({ title }) => title)).toEqual([
      'Functional requirements',
      'Mentor discovery',
      kindViewFixtures.get(itemOf('REQ-001').kind)?.title,
    ])
  })

  it('gives nothing for a section at the top', () => {
    const top = assertPresent(
      document.items.find(({ parent_item_id }) => parent_item_id === null),
      'No item at the top',
    )

    expect(outlineBreadcrumb(top, outline)).toEqual([])
  })
})

describe('documentBlocks', () => {
  it('gives a heading for each section, at a level that follows its depth', () => {
    const blocks = documentBlocks({
      ...mentorDocument('requirement_specification'),
      kinds: kindViewFixtures,
    })
    const headings = blocks.flatMap((block) =>
      block.type === 'heading' ? [`${String(block.level)} ${block.title}`] : [],
    )

    expect(headings).toEqual([
      '2 Introduction',
      '2 Overall description',
      '2 Functional requirements',
      '3 Mentor discovery',
      '3 Booking',
      '3 Mentor profile',
      '2 Non-functional requirements',
    ])
  })

  it('draws a run of items of one kind with the display of the kind', () => {
    const blocks = documentBlocks({
      ...mentorDocument('requirement_specification'),
      kinds: kindViewFixtures,
    })
    const runs = blocks.flatMap((block) =>
      block.type === 'items' ? [`${block.display}:${String(block.items.length)}`] : [],
    )

    expect(runs).toEqual(['table:2', 'table:3', 'table:2', 'table:3'])
  })

  it('gives a heading with the count for each group of a document without sections', () => {
    const blocks = documentBlocks({
      ...mentorDocument('requirements_analysis'),
      kinds: kindViewFixtures,
    })

    expect(blocks.slice(0, 2)).toMatchObject([
      { type: 'group', title: 'Stated need', count: 8 },
      { type: 'items', display: 'table' },
    ])
  })

  it('draws cards and transcripts with their own display', () => {
    const persona = documentBlocks({
      ...mentorDocument('persona_catalog'),
      kinds: kindViewFixtures,
    })
    const transcript = documentBlocks({
      ...mentorDocument('interview_transcript'),
      kinds: kindViewFixtures,
    })

    expect(persona.at(-1)).toMatchObject({ type: 'items', display: 'cards' })
    expect(transcript.at(-1)).toMatchObject({ type: 'items', display: 'transcript' })
  })

  it('gives nothing for a document without items', () => {
    expect(
      documentBlocks({ ...mentorDocument('elicitation_plan'), kinds: kindViewFixtures }),
    ).toEqual([])
  })
})

describe('isBranch', () => {
  it('holds for a section and a group, not for the rows under them', () => {
    const nodes = outlineOf('requirement_specification')
    const types = new Map<string, boolean>()
    const visit = (rows: readonly OutlineNode[]) => {
      for (const node of rows) {
        types.set(node.type, isBranch(node))
        if (isBranch(node)) visit(node.children)
      }
    }
    visit(nodes)

    expect(types.get('section')).toBe(true)
    expect(types.get('group')).toBe(true)
    expect(types.get('item')).toBe(false)
  })
})
