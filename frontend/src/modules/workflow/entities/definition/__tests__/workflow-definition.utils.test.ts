import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'

import { checkpointNodes, edgesFrom, findNode, findValueList } from '../workflow-definition.utils'
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
