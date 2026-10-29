import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'

import { canLinkTypeConnect, findLinkType, kindLevelsOf, targetKindsOf } from '../link-types.utils'
import { connectCases, levelCases, targetKindCases } from './link-types.utils.data'

describe('findLinkType', () => {
  it.each([
    { key: 'derived_from', found: true },
    { key: 'no_such_type', found: false },
  ])('answers for $key', ({ key, found }) => {
    expect(findLinkType(workflowDefinitionFixture, key)?.key ?? null).toBe(found ? key : null)
  })
})

describe('targetKindsOf', () => {
  it.each(targetKindCases)('gives $name', ({ linkType, expected }) => {
    expect(targetKindsOf(linkType)).toEqual(expected)
  })
})

describe('canLinkTypeConnect', () => {
  it.each(connectCases)('answers for $name', ({ linkType, source, target, expected }) => {
    expect(canLinkTypeConnect(linkType, source, target)).toBe(expected)
  })
})

describe('kindLevelsOf', () => {
  it.each(levelCases)('gives the levels of $name', ({ linkType, expected }) => {
    expect(kindLevelsOf(linkType)).toEqual(expected)
  })

  it('gives the chain from the backlog to the raw requirements for derived_from of version 1', () => {
    const derivedFrom = workflowDefinitionFixture.link_types.find(
      ({ key }) => key === 'derived_from',
    )

    expect(derivedFrom && kindLevelsOf(derivedFrom)).toEqual([
      ['backlog_item'],
      ['spec_requirement'],
      ['analyzed_requirement'],
      ['raw_requirement', 'latent_need'],
    ])
  })
})
