import { describe, expect, it } from 'vitest'

import {
  attentionCounts,
  attentionLevel,
  branchAttention,
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
