import { describe, expect, it } from 'vitest'

import { assertPresent } from '@/shared/lib/guards'

import type { OutlineNode } from '../outline.types'
import {
  isBranch,
  outlineBreadcrumb,
  outlineNeighbors,
  outlineSequence,
} from '../outline-path.utils'
import { kindViewFixtures, mentorDocument, outlineOf } from './outline.utils.data'

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
