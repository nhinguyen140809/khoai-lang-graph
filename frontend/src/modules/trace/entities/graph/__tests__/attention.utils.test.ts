import { describe, expect, it } from 'vitest'

import { actGapKeys, isActGap, itemAttention, linkAttention } from '../attention.utils'
import type { AttentionContext, AttentionItem } from '../trace-graph.types'
import { traceItem, traceLink } from './trace-graph.utils.data'

const issueKinds = [{ kind: 'ambiguity_issue', statusField: 'status', openValues: ['open'] }]

const openIssue = traceItem('issue', 'AMB-001', 'ambiguity_issue', {
  content: { title: 'Fast has no number', status: 'open' },
})
const approved = traceItem('req', 'REQ-001', 'spec_requirement')
const rejected = traceItem('gone', 'REQ-009', 'spec_requirement', { review_status: 'rejected' })

describe('linkAttention', () => {
  it.each([
    {
      rule: 'the target changed after the link was made',
      source: approved,
      link: traceLink('l1', 'req', 'ar', 'derived_from', { target_version: 1 }),
      target: traceItem('ar', 'AR-001', 'analyzed_requirement', { version: 3 }),
      level: 'act',
    },
    {
      rule: 'the target was replaced',
      source: approved,
      link: traceLink('l2', 'req', 'ar', 'derived_from', { target_version: 1 }),
      target: traceItem('ar', 'AR-001', 'analyzed_requirement', {
        review_status: 'superseded',
      }),
      level: 'act',
    },
    {
      rule: 'one end was rejected',
      source: approved,
      link: traceLink('l3', 'req', 'gone', 'derived_from'),
      target: rejected,
      level: 'quiet',
    },
    {
      rule: 'the link comes from an open issue',
      source: openIssue,
      link: traceLink('l4', 'issue', 'req', 'concerns'),
      target: approved,
      level: 'follow',
    },
    {
      rule: 'nothing asks of the user',
      source: approved,
      link: traceLink('l5', 'req', 'ar', 'derived_from'),
      target: traceItem('ar', 'AR-001', 'analyzed_requirement'),
      level: 'none',
    },
  ])('gives $level when $rule', ({ source, link, target, level }) => {
    expect(linkAttention(link, { source, target }, issueKinds)).toBe(level)
  })

  it('gives act over quiet when the target changed and an end was rejected', () => {
    const link = traceLink('l6', 'req', 'gone', 'derived_from', { target_version: 1 })
    const target = traceItem('gone', 'REQ-009', 'spec_requirement', {
      version: 2,
      review_status: 'superseded',
    })

    expect(linkAttention(link, { source: approved, target }, issueKinds)).toBe('act')
  })
})

/** An attention context as `useTraceAttention` builds it. */
function contextOf({
  gapsOfItem = new Map(),
  issueReasonsOfItem = new Map(),
  openIssueIds = new Set<string>(),
}: Partial<AttentionContext> = {}): AttentionContext {
  return { gapsOfItem, issueReasonsOfItem, openIssueIds }
}

const anItem: AttentionItem = {
  id: 'req',
  kind: 'spec_requirement',
  review_status: 'approved',
  content: {},
}

describe('actGapKeys', () => {
  it('names the gaps that ask the user to act now', () => {
    expect([...actGapKeys]).toEqual(['needs_review'])
  })

  it('isActGap answers for the key of a gap', () => {
    expect(isActGap('needs_review')).toBe(true)
    expect(isActGap('without_user_story')).toBe(false)
  })
})

describe('itemAttention', () => {
  it('gives act when a gap of the act keys holds the item, with the description of the gap', () => {
    const attention = itemAttention(
      anItem,
      contextOf({
        gapsOfItem: new Map([
          ['req', [{ key: 'needs_review', description: 'The links need a new look.' }]],
        ]),
      }),
    )

    expect(attention).toEqual({ level: 'act', reasons: ['The links need a new look.'] })
  })

  it('gives act when an open issue is about the item, with the words of the issue', () => {
    const attention = itemAttention(
      anItem,
      contextOf({
        issueReasonsOfItem: new Map([['req', ['An open Disagreement concerns this item.']]]),
      }),
    )

    expect(attention).toEqual({
      level: 'act',
      reasons: ['An open Disagreement concerns this item.'],
    })
  })

  it('gives act over follow when both hold, with the reasons of the level that holds', () => {
    const attention = itemAttention(
      anItem,
      contextOf({
        gapsOfItem: new Map([
          ['req', [{ key: 'no_source', description: 'These requirements have no source.' }]],
        ]),
        issueReasonsOfItem: new Map([['req', ['An open Disagreement concerns this item.']]]),
      }),
    )

    expect(attention).toEqual({
      level: 'act',
      reasons: ['An open Disagreement concerns this item.'],
    })
  })

  it('gives follow when another gap holds the item, a gap the user only follows', () => {
    const attention = itemAttention(
      anItem,
      contextOf({
        gapsOfItem: new Map([
          ['req', [{ key: 'no_source', description: 'These requirements have no source.' }]],
        ]),
      }),
    )

    expect(attention).toEqual({
      level: 'follow',
      reasons: ['These requirements have no source.'],
    })
  })

  it('gives follow when the item is itself an open issue, with its own words', () => {
    const attention = itemAttention(
      { ...anItem, id: 'issue', kind: 'ambiguity_issue' },
      contextOf({ openIssueIds: new Set(['issue']) }),
    )

    expect(attention).toEqual({ level: 'follow', reasons: ['This item is an open issue.'] })
  })

  it('gives follow over quiet when the item is a rejected open issue', () => {
    const attention = itemAttention(
      { ...anItem, id: 'issue', review_status: 'rejected' },
      contextOf({ openIssueIds: new Set(['issue']) }),
    )

    expect(attention.level).toBe('follow')
  })

  it('gives quiet when the item was rejected or replaced, with the words of its status', () => {
    expect(itemAttention({ ...anItem, review_status: 'rejected' }, contextOf())).toEqual({
      level: 'quiet',
      reasons: ['This item was rejected.'],
    })
    expect(itemAttention({ ...anItem, review_status: 'superseded' }, contextOf())).toEqual({
      level: 'quiet',
      reasons: ['This item was replaced.'],
    })
  })

  it('gives none when nothing asks of the item', () => {
    expect(itemAttention(anItem, contextOf())).toEqual({ level: 'none', reasons: [] })
  })

  it('reads the status of the issue from its own kind, so a kind a later version adds works', () => {
    const openValidation = traceItem('val', 'VAL-001', 'validation_issue', {
      content: { title: 'A wrong count', status: 'open' },
    })

    expect(
      linkAttention(
        traceLink('l7', 'val', 'req', 'flags'),
        { source: openValidation, target: approved },
        [{ kind: 'validation_issue', statusField: 'status', openValues: ['open'] }],
      ),
    ).toBe('follow')
  })
})
