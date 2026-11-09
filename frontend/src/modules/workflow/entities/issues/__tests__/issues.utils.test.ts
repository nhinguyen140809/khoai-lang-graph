import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'

import { isOpenIssue, issueKinds, issueLinkTypesByKind } from '../issues.utils'
import { issueKindCases, issueLinkTypeCases, openIssueCases } from './issues.utils.data'

describe('issueKinds', () => {
  it('lists the three issue kinds of version 1 with where their status is', () => {
    expect(issueKinds(workflowDefinitionFixture)).toEqual([
      { kind: 'ambiguity_issue', statusField: 'status', openValues: ['open'] },
      { kind: 'conflict', statusField: 'status', openValues: ['open'] },
      { kind: 'validation_issue', statusField: 'status', openValues: ['open'] },
    ])
  })

  it.each(issueKindCases)('gives $name', ({ itemKinds, expected }) => {
    expect(issueKinds({ ...workflowDefinitionFixture, item_kinds: itemKinds })).toEqual(expected)
  })
})

describe('issueLinkTypesByKind', () => {
  it('names the link types of the three issue kinds of version 1', () => {
    expect(issueLinkTypesByKind(workflowDefinitionFixture)).toEqual(
      new Map([
        ['ambiguity_issue', { about: ['concerns'], parties: [] }],
        ['conflict', { about: ['concerns'], parties: ['involves'] }],
        ['validation_issue', { about: ['flags'], parties: [] }],
      ]),
    )
  })

  it.each(issueLinkTypeCases)('gives $name', ({ itemKinds, expected }) => {
    const kinds = issueLinkTypesByKind({ ...workflowDefinitionFixture, item_kinds: itemKinds })

    expect(Object.fromEntries(kinds)).toEqual(expected)
  })
})

describe('isOpenIssue', () => {
  it.each(openIssueCases)('answers for $name', ({ item, kinds, expected }) => {
    expect(isOpenIssue(item, kinds)).toBe(expected)
  })
})
