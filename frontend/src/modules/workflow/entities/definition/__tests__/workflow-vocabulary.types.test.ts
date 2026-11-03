import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'

import { workflowDefinitionSchema } from '../workflow-definition.types'

describe('the vocabulary of the workflow', () => {
  it('gives each link type the sides that may quote words', () => {
    for (const { key, quotes } of workflowDefinitionFixture.link_types) {
      expect(typeof quotes.source, key).toBe('boolean')
      expect(typeof quotes.target, key).toBe('boolean')
    }
  })

  it('parses the definition of the mock', () => {
    expect(workflowDefinitionSchema.safeParse(workflowDefinitionFixture).success).toBe(true)
  })
})
