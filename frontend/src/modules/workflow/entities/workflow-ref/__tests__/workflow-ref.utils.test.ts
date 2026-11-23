import { describe, expect, it } from 'vitest'

import { assistanceRefFixture } from '@/mocks/workflow/workflow.fixtures'

import { workflowRefOf } from '../workflow-ref.utils'

describe('workflowRefOf', () => {
  it('names the workflow and the version that a run ran', () => {
    expect(
      workflowRefOf({
        workflow_name: assistanceRefFixture.name,
        workflow_version: assistanceRefFixture.version,
      }),
    ).toEqual(assistanceRefFixture)
  })

  it('names none for no run, so that what reads a definition waits for it', () => {
    expect(workflowRefOf(null)).toBeUndefined()
    expect(workflowRefOf(undefined)).toBeUndefined()
  })
})
