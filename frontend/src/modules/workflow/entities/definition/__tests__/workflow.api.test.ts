import { describe, expect, it } from 'vitest'

import {
  assistanceDefinitionFixture,
  assistanceRefFixture,
} from '@/mocks/workflow/workflow.fixtures'
import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import { getWorkflowDefinition } from '../workflow.api'
import { apiErrorCases, sentRequestCases } from './workflow.api.data'

describe('workflow api', () => {
  it('reads the graph and the names of the definition', async () => {
    const definition = await getWorkflowDefinition()

    expect(definition).toMatchObject({ name: 'requirements_engineering', version: 2 })
    expect(definition.nodes.map(({ id }) => id)).toContain('checkpoint_analysis')
    expect(definition.stages.find(({ key }) => key === 'analysis_review')?.title).toBe(
      'Reviewing the analysis',
    )
  })

  it('reads the definition of the workflow that a name gives, such as the one of an answer', async () => {
    const { name, version, tools, stages } = assistanceDefinitionFixture

    const definition = await getWorkflowDefinition(assistanceRefFixture)

    expect(definition).toMatchObject({ name, version })
    expect(definition.tools.map(({ key }) => key)).toEqual(tools.map(({ key }) => key))
    expect(definition.stages.map(({ key, title }) => [key, title])).toEqual(
      stages.map(({ key, title }) => [key, title]),
    )
  })

  itSendsRequests(sentRequestCases)

  itThrowsApiErrors(apiErrorCases)
})
