import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'
import { actKeys } from '@/shared/components/act'

import { workflowDefinitionSchema } from '../workflow-definition.types'

describe('the vocabulary of the workflow', () => {
  it('gives each link type the sides that may quote words', () => {
    for (const { key, quotes } of workflowDefinitionFixture.link_types) {
      expect(typeof quotes.source, key).toBe('boolean')
      expect(typeof quotes.target, key).toBe('boolean')
    }
  })

  it('names the link types that only the agents create, which the user never starts by hand', () => {
    const agentOnly = workflowDefinitionFixture.link_types
      .filter((linkType) => linkType.agent_only)
      .map(({ key }) => key)

    expect(agentOnly).toEqual(['duplicates', 'supersedes', 'grounded_in'])
  })

  it('parses the definition of the mock', () => {
    expect(workflowDefinitionSchema.safeParse(workflowDefinitionFixture).success).toBe(true)
  })

  it('names only acts that the catalog has, in its stages and in its tools', () => {
    // The schema fills in the acts that the mock leaves out.
    const definition = workflowDefinitionSchema.parse(workflowDefinitionFixture)
    const named = [
      ...definition.stages.map(({ key, acts }) => ({ owner: `stage ${key}`, acts })),
      ...definition.tools.map(({ key, acts }) => ({ owner: `tool ${key}`, acts })),
    ]

    for (const { owner, acts } of named) {
      for (const act of acts) expect(actKeys, owner).toContain(act)
    }
  })
})
