import { describe, expect, it } from 'vitest'

import { readWorkflowDefinitionName } from '@/test/docs'

import { mainWorkflowName } from '../main-workflow.constants'

describe('the main workflow', () => {
  it('is the workflow that the docs define for the work of a project', () => {
    expect(mainWorkflowName).toBe(readWorkflowDefinitionName('requirements_engineering.v2.json'))
  })
})
