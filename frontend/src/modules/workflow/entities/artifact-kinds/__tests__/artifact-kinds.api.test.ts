import { describe, expect, it } from 'vitest'

import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import { getArtifactKinds, getContentSchema } from '../artifact-kinds.api'
import { apiErrorCases, sentRequestCases } from './artifact-kinds.api.data'

describe('artifact kinds api', () => {
  it('reads the artifact kinds with their item kinds', async () => {
    const { artifact_kinds: kinds } = await getArtifactKinds()

    expect(kinds.map(({ kind }) => kind)).toContain('requirement_specification')
    expect(
      kinds.flatMap(({ item_kinds: itemKinds }) => itemKinds.map(({ kind }) => kind)),
    ).toContain('spec_requirement')
  })

  it('reads the content schema of a kind', async () => {
    await expect(getContentSchema('spec_requirement', 1)).resolves.toMatchObject({
      title: 'Requirement',
    })
  })

  itSendsRequests(sentRequestCases)

  itThrowsApiErrors(apiErrorCases)
})
