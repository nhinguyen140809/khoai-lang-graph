import { describe, expect, it } from 'vitest'

import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import { getWorkflowDefinition } from '../workflow.api'
import { apiErrorCases, sentRequestCases } from './workflow.api.data'

describe('workflow api', () => {
  it('reads the graph and the names of the definition', async () => {
    const definition = await getWorkflowDefinition()

    expect(definition).toMatchObject({ name: 'requirements_engineering', version: 1 })
    expect(definition.nodes.map(({ id }) => id)).toContain('checkpoint_analysis')
    expect(definition.stages.find(({ key }) => key === 'analysis_review')?.title).toBe(
      'Reviewing the analysis',
    )
  })

  itSendsRequests(sentRequestCases)

  itThrowsApiErrors(apiErrorCases)
})
