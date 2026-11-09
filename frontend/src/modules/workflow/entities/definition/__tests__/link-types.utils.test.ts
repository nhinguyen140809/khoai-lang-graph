import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'

import {
  canLinkTypeConnect,
  findLinkType,
  kindLevelsOf,
  linkTypesFrom,
  targetKindsOf,
} from '../link-types.utils'
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

describe('linkTypesFrom', () => {
  it.each([
    {
      kind: 'the raw requirement',
      sourceKind: 'raw_requirement',
      choices: [
        { key: 'evidenced_by', title: 'Evidenced by', targetKinds: ['interview_message'] },
        { key: 'stated_by', title: 'Stated by', targetKinds: ['persona'] },
      ],
    },
    {
      kind: 'the latent need',
      sourceKind: 'latent_need',
      choices: [
        { key: 'evidenced_by', title: 'Evidenced by', targetKinds: ['interview_message'] },
        { key: 'involves', title: 'Involves', targetKinds: ['persona'] },
      ],
    },
    {
      kind: 'the analyzed requirement',
      sourceKind: 'analyzed_requirement',
      choices: [
        { key: 'involves', title: 'Involves', targetKinds: ['persona'] },
        {
          key: 'derived_from',
          title: 'Based on',
          targetKinds: ['raw_requirement', 'latent_need'],
        },
      ],
    },
    {
      kind: 'the specified requirement',
      sourceKind: 'spec_requirement',
      choices: [
        { key: 'derived_from', title: 'Based on', targetKinds: ['analyzed_requirement'] },
        { key: 'depends_on', title: 'Depends on', targetKinds: ['spec_requirement'] },
      ],
    },
    {
      kind: 'the backlog item',
      sourceKind: 'backlog_item',
      choices: [
        { key: 'derived_from', title: 'Based on', targetKinds: ['spec_requirement'] },
        { key: 'depends_on', title: 'Depends on', targetKinds: ['backlog_item'] },
      ],
    },
    {
      kind: 'the conflict',
      sourceKind: 'conflict',
      choices: [
        { key: 'involves', title: 'Involves', targetKinds: ['persona'] },
        {
          key: 'concerns',
          title: 'Applies to',
          targetKinds: ['raw_requirement', 'analyzed_requirement', 'spec_requirement'],
        },
        { key: 'resolved_by', title: 'Resolved by', targetKinds: ['interview_message'] },
      ],
    },
    {
      kind: 'the validation issue, whose one link names no kind',
      sourceKind: 'validation_issue',
      choices: [{ key: 'flags', title: 'Points out', targetKinds: [] }],
    },
    { kind: 'the persona, from which no link starts', sourceKind: 'persona', choices: [] },
    {
      kind: 'the interview message, from which no link starts',
      sourceKind: 'interview_message',
      choices: [],
    },
  ])('gives the kinds of link that $kind may start', ({ sourceKind, choices }) => {
    expect(linkTypesFrom(workflowDefinitionFixture, sourceKind)).toEqual(choices)
  })

  it('leaves out a link type that only the agents create, whatever its key', () => {
    const derivedFrom = findLinkType(workflowDefinitionFixture, 'derived_from')
    if (derivedFrom === null) throw new Error('The definition lost derived_from')
    const definition = {
      ...workflowDefinitionFixture,
      link_types: [
        { ...derivedFrom, key: 'by_agents', agent_only: true },
        { ...derivedFrom, key: 'by_people', agent_only: false },
      ],
    }

    expect(linkTypesFrom(definition, 'analyzed_requirement').map(({ key }) => key)).toEqual([
      'by_people',
    ])
  })
})
