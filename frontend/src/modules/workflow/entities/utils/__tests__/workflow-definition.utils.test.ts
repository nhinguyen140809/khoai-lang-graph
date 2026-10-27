import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'

import {
  checkpointNodes,
  edgesFrom,
  findNode,
  findValueList,
  reviewableCheckpoints,
  stageTitles,
  visibleStages,
  visibleStageTitle,
} from '../workflow-definition.utils'
import {
  edgeCases,
  expectedVisibleStages,
  nestedStages,
  nodeCases,
  valueListCases,
  visibleTitleCases,
} from './workflow-definition.utils.data'

describe('stageTitles', () => {
  it('maps the key of each stage to its title', () => {
    const titles = stageTitles(workflowDefinitionFixture)

    expect(titles.size).toBe(workflowDefinitionFixture.stages.length)
    expect(titles.get('analysis_review')).toBe('Reviewing the analysis')
  })
})

describe('visibleStages', () => {
  it('nests the stages by parent and leaves out the internal ones with their children', () => {
    expect(visibleStages({ ...workflowDefinitionFixture, stages: nestedStages })).toEqual(
      expectedVisibleStages,
    )
  })

  it('lists the stages of version 1 flat, without the internal one', () => {
    const keys = visibleStages(workflowDefinitionFixture).map(({ key }) => key)

    expect(keys).not.toContain('intent_routing')
    expect(keys).toHaveLength(workflowDefinitionFixture.stages.length - 1)
  })
})

describe('visibleStageTitle', () => {
  it.each(visibleTitleCases)('gives the title for $name', ({ stage, title }) => {
    const definition = { ...workflowDefinitionFixture, stages: nestedStages }

    expect(visibleStageTitle(definition, stage)).toBe(title)
  })

  it('gives no title for the first stage of version 1, which is internal', () => {
    expect(visibleStageTitle(workflowDefinitionFixture, 'intent_routing')).toBeNull()
  })
})

describe('reviewableCheckpoints', () => {
  it('names each checkpoint by its title and describes it by its prompt', () => {
    const choices = reviewableCheckpoints(workflowDefinitionFixture)

    expect(choices.map(({ id, title }) => [id, title])).toEqual([
      ['checkpoint_personas', 'Finalize the interviewees'],
      ['checkpoint_analysis', 'Review the analysis'],
      ['checkpoint_spec', 'Review the specification'],
    ])
    expect(choices[0]?.description).toBe(
      'Review the personas. Edit them if needed, then approve them.',
    )
  })
})

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
