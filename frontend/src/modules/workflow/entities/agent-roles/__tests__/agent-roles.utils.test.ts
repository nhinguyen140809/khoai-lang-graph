import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'

import { agentRoleLabels, findAgentRole } from '../agent-roles.utils'

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
