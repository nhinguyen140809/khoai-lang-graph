import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'

import {
  agentRoleLabels,
  checkpointNodes,
  edgesFrom,
  findAgentRole,
  findNode,
  findValueList,
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
      'checkpoint_personas',
      'checkpoint_analysis',
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

describe('findAgentRole', () => {
  it('gives the agent role of its key', () => {
    const interviewer = findAgentRole(workflowDefinitionFixture, 'interviewer')

    expect(interviewer?.label).toBe('Interviewer')
  })

  it('gives undefined for a key that the definition does not hold', () => {
    expect(findAgentRole(workflowDefinitionFixture, 'nobody')).toBeUndefined()
  })
})
