import { describe, expect, it } from 'vitest'

import type { ArtifactItem } from '../../items/items.types'
import {
  attentionCounts,
  attentionLevel,
  attentionText,
  branchAttention,
  editedItems,
  highestLevel,
  itemStatus,
  itemStatusLook,
  mergeStatusCounts,
} from '../item-status.utils'
import {
  attentionCases,
  attentionCountCases,
  highestLevelCases,
  itemStatusCases,
} from './item-status.utils.data'

describe('editedItems', () => {
  const agent = {
    actor: 'agent' as const,
    agent_role: null,
    user_id: null,
    run_id: null,
    step_id: null,
  }
  const itemOf = (id: string): ArtifactItem => ({
    id,
    artifact_id: 'a1',
    project_id: 'p1',
    key: id,
    kind: 'spec_requirement',
    parent_item_id: null,
    position: 1,
    outline_number: '1',
    schema_version: 1,
    version: 1,
    content: {},
    review_status: 'approved',
    created_by: agent,
    updated_by: agent,
    created_at: '2026-10-06T08:00:00Z',
    updated_at: '2026-10-06T08:00:00Z',
  })

  it('keeps the items that the user changed and that are still draft', () => {
    const items: ArtifactItem[] = [
      itemOf('edited'),
      { ...itemOf('approved-by-user'), updated_by: { ...agent, actor: 'user' } },
      {
        ...itemOf('changed'),
        review_status: 'draft',
        updated_by: { ...agent, actor: 'user' },
      },
    ]

    expect(editedItems(items).map(({ id }) => id)).toEqual(['changed'])
  })
})

describe('itemStatus', () => {
  it.each(itemStatusCases)('reads $name', ({ item, status }) => {
    expect(
      itemStatus(item, [{ kind: 'conflict', statusField: 'status', openValues: ['open'] }]),
    ).toBe(status)
  })
})

describe('attentionLevel', () => {
  it.each(attentionCases)(
    'puts $status at $level when under review is $isUnderReview',
    ({ status, isUnderReview, level }) => {
      expect(attentionLevel(status, { isUnderReview })).toBe(level)
    },
  )
})

describe('highestLevel', () => {
  it.each(highestLevelCases)('gives $level for $levels', ({ levels, level }) => {
    expect(highestLevel(levels)).toBe(level)
  })
})

describe('attentionCounts', () => {
  it.each(attentionCountCases)('counts $name', ({ statuses, isUnderReview, counts }) => {
    const found = attentionCounts(statuses, { isUnderReview })

    expect(
      found.map(({ status, level, count, first }) => ({ status, level, count, first: first.key })),
    ).toEqual(counts)
  })
})

describe('mergeStatusCounts', () => {
  it('adds the counts of the same status, in the order the statuses first appear', () => {
    expect(
      mergeStatusCounts([
        [{ status: 'draft', count: 2 }],
        [
          { status: 'approved', count: 1 },
          { status: 'draft', count: 3 },
        ],
        [],
      ]),
    ).toEqual([
      { status: 'draft', count: 5 },
      { status: 'approved', count: 1 },
    ])
  })
})

describe('branchAttention', () => {
  const counts = [
    { status: 'approved', count: 4 },
    { status: 'edited', count: 1 },
    { status: 'draft', count: 3 },
  ] as const

  it('takes the highest level and words the rows that ask something, under review', () => {
    expect(branchAttention(counts, { isUnderReview: true })).toEqual({
      level: 'act',
      text: '3 to review, 1 edited',
    })
  })

  it('leaves the drafts out of a document that is not under review', () => {
    expect(branchAttention(counts, { isUnderReview: false })).toEqual({
      level: 'follow',
      text: '1 edited',
    })
  })

  it('gives the level none and no words without any count', () => {
    expect(branchAttention([], { isUnderReview: true })).toEqual({ level: 'none', text: '' })
  })
})

describe('itemStatusLook', () => {
  it('words a draft of a document under review as needing the review of the user', () => {
    expect(itemStatusLook('draft', { isUnderReview: true }, 'user')).toMatchObject({
      level: 'act',
      label: 'Needs your review',
    })
  })

  it('shows the letter of an open issue only where the user can act on it', () => {
    expect(itemStatusLook('openIssue', { isUnderReview: false }, 'user').letter).toBeNull()
    expect(itemStatusLook('openIssue', { isUnderReview: true }, 'user').letter).toBe('?')
  })
})

describe('the out of date status', () => {
  const issueKinds = [{ kind: 'conflict', statusField: 'status', openValues: ['open'] }]
  const agent = {
    actor: 'agent' as const,
    agent_role: null,
    user_id: null,
    run_id: null,
    step_id: null,
  }
  const itemOf = (id: string) => ({
    id,
    kind: 'spec_requirement',
    content: {},
    review_status: 'approved' as const,
    updated_by: agent,
  })

  it('comes after an open issue and before an edited item', () => {
    const ids = new Set(['item-2'])

    expect(itemStatus(itemOf('item-2'), [], { outOfDateIds: ids })).toBe('outOfDate')
    expect(
      itemStatus(
        { ...itemOf('issue'), kind: 'conflict', content: { status: 'open' } },
        issueKinds,
        { outOfDateIds: ids },
      ),
    ).toBe('openIssue')
    expect(
      itemStatus(
        {
          ...itemOf('item-3'),
          review_status: 'draft',
          updated_by: { ...agent, actor: 'user' as const },
        },
        [],
        { outOfDateIds: new Set(['item-3']) },
      ),
    ).toBe('outOfDate')
  })

  it('never shows without the ids', () => {
    expect(itemStatus(itemOf('item-2'), [])).toBe('approved')
  })

  it('never shows without the ids, asks to act under review, and follows outside it', () => {
    expect(attentionLevel('outOfDate', { isUnderReview: true })).toBe('act')
    expect(attentionLevel('outOfDate', { isUnderReview: false })).toBe('follow')
    expect(attentionText('outOfDate', 2)).toBe('2 out of date')
  })

  it('reads its letter and label', () => {
    const look = itemStatusLook('outOfDate', { isUnderReview: true }, 'user')

    expect(look.letter).toBe('!')
    expect(look.label).toBe('Based on an older version')
  })
})
