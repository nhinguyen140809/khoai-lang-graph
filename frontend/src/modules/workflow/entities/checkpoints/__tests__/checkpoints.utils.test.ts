import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'

import { checkpointNodes, reviewableCheckpoints } from '../checkpoints.utils'

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
