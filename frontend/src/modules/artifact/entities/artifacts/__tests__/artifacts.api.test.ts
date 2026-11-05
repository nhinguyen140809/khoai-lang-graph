import { describe, expect, it, vi } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { HttpHeader } from '@/shared/api/http'
import { recordRequests } from '@/test/msw'
import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import { getArtifact, listProjectArtifacts, updateArtifact } from '../artifacts.api'
import { analysis, apiErrorCases, plan, sentRequestCases } from './artifacts.api.data'

describe('artifacts api', () => {
  it('lists the artifacts of a project in the order of the stages that make them', async () => {
    const artifacts = await listProjectArtifacts(projectIds.mentor)

    expect(artifacts.map(({ kind }) => kind).slice(0, 2)).toEqual([
      'elicitation_plan',
      'persona_catalog',
    ])
  })

  it('lists only the artifacts that match the filters', async () => {
    const artifacts = await listProjectArtifacts(projectIds.mentor, {
      kind: 'requirement_specification',
    })

    expect(artifacts.map(({ kind }) => kind)).toEqual(['requirement_specification'])
  })

  it('reads an artifact as it was at an older version', async () => {
    const older = await getArtifact(plan.id, 1)

    expect(older).toMatchObject({ id: plan.id, version: 1 })
  })

  it('saves a change with the version that it is based on', async () => {
    const requests = recordRequests([HttpHeader.IfMatch])

    const saved = await updateArtifact(analysis.id, analysis.version, {
      title: 'Analysis of the interviews',
    })

    expect(saved).toMatchObject({
      title: 'Analysis of the interviews',
      version: analysis.version + 1,
    })
    await vi.waitFor(() => {
      expect(requests).toHaveLength(1)
    })
    expect(requests[0]?.headers).toEqual({ [HttpHeader.IfMatch]: String(analysis.version) })
  })

  itSendsRequests(sentRequestCases)

  itThrowsApiErrors(apiErrorCases)
})
