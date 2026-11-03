import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'

import { reviewableCheckpoints } from '../checkpoints.utils'

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
