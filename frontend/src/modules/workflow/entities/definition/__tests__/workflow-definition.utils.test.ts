import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'

import {
  actsOf,
  agentRoleLabels,
  checkpointNodes,
  edgesFrom,
  findAgentRole,
  findNode,
  findTool,
  findValueList,
  linkTypeTitles,
  subjectKindByStage,
} from '../workflow-definition.utils'
import { edgeCases, nodeCases, valueListCases } from './workflow-definition.utils.data'

describe('findNode', () => {
  it.each(nodeCases)('finds $name', ({ nodeId, kind }) => {
    expect(findNode(workflowDefinitionFixture, nodeId)?.kind ?? null).toBe(kind)
  })
})

describe('checkpointNodes', () => {
  it('lists the checkpoints in the order of the definition', () => {
    expect(checkpointNodes(workflowDefinitionFixture).map(({ id }) => id)).toEqual([
      'ask_message',
      'checkpoint_plan',
      'ask_personas',
      'checkpoint_personas',
      'ask_analysis',
      'checkpoint_analysis',
      'ask_spec',
      'checkpoint_spec',
    ])
  })
})

describe('edgesFrom', () => {
  it.each(edgeCases)('lists the edges that leave $name', ({ nodeId, targets }) => {
    const edges = edgesFrom(workflowDefinitionFixture, nodeId)

    expect(edges.map(({ target }) => target)).toEqual(targets)
  })
})

describe('findValueList', () => {
  it.each(valueListCases)('finds $name', ({ key, values }) => {
    const list = findValueList(workflowDefinitionFixture, key)

    expect(list?.values.map((value) => value.key) ?? null).toEqual(values)
  })
})

describe('agentRoleLabels', () => {
  it('gives the label of each agent role of the definition, by its key', () => {
    const labels = agentRoleLabels(workflowDefinitionFixture)

    expect(labels.get('interviewer')).toBe('Interviewer')
    expect(labels.size).toBe(workflowDefinitionFixture.agent_roles.length)
  })
})

describe('linkTypeTitles', () => {
  it('gives the title of each link type of the definition, by its key', () => {
    const titles = linkTypeTitles(workflowDefinitionFixture)

    expect(titles.get('derived_from')).toBe('Based on')
    expect(titles.size).toBe(workflowDefinitionFixture.link_types.length)
  })
})

describe('subjectKindByStage', () => {
  it('gives the subject item kind of each stage that runs once for each subject', () => {
    const subjectsOfStage = subjectKindByStage(workflowDefinitionFixture)

    expect(subjectsOfStage.get('interviewing')).toBe('persona')
    // A kind with one artifact for the project gives its stage no subject.
    expect(subjectsOfStage.has('planning')).toBe(false)
  })
})

describe('findAgentRole', () => {
  it('gives the agent role of its key', () => {
    const interviewer = findAgentRole(workflowDefinitionFixture, 'interviewer')

    expect(interviewer?.label).toBe('Interviewer')
  })

  it('gives undefined for a key that the definition does not hold', () => {
    expect(findAgentRole(workflowDefinitionFixture, 'nobody')).toBeUndefined()
  })
})

describe('findTool', () => {
  it('gives the tool of the definition with the key', () => {
    const tool = {
      key: 'search',
      title: 'Web search',
      description: 'Searches the web.',
      uses: { one: 'Searched once', other: 'Searched {count} times' },
      icon: 'search',
      acts: [] as string[],
    } as const

    expect(findTool({ tools: [tool] }, 'search')).toEqual(tool)
  })

  it('gives undefined for a key that the definition does not list', () => {
    expect(findTool({ tools: [] }, 'search')).toBeUndefined()
  })
})

describe('actsOf', () => {
  const definition = {
    stages: [
      {
        key: 'research',
        title: 'Research',
        internal: false,
        parent: null,
        acts: ['search', 'read'],
      },
      { key: 'plain', title: 'Plain', internal: false, parent: null, acts: [] },
    ],
    tools: [
      {
        key: 'search',
        title: 'Web search',
        description: 'Searches the web.',
        uses: { one: 'Searched once', other: 'Searched {count} times' },
        icon: 'search' as const,
        acts: ['fetch'],
      },
      {
        key: 'quiet',
        title: 'Quiet',
        description: 'Names no act.',
        uses: { one: 'Once', other: '{count} times' },
        icon: 'tool' as const,
        acts: [],
      },
    ],
  }

  it('gives the acts of the tool in use, in place of those of the stage', () => {
    expect(actsOf(definition, { stage: 'research', tool: 'search' })).toEqual(['fetch'])
  })

  it('gives the acts of the stage for a tool that names none, or no tool', () => {
    expect(actsOf(definition, { stage: 'research', tool: 'quiet' })).toEqual(['search', 'read'])
    expect(actsOf(definition, { stage: 'research', tool: null })).toEqual(['search', 'read'])
  })

  it('gives none for a stage that names none, or one that is not there', () => {
    expect(actsOf(definition, { stage: 'plain', tool: null })).toEqual([])
    expect(actsOf(definition, { stage: 'nothing', tool: 'nothing' })).toEqual([])
    expect(actsOf(definition, { stage: null, tool: null })).toEqual([])
  })
})
