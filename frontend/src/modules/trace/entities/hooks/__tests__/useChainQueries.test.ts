import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { useArtifactTrace, useItemTrace } from '../useChainQueries'

const projectId = projectIds.mentor
const requirement = itemFixtureByKey(projectId, 'REQ-001')
const specification = artifactFixtureByKind(projectId, 'requirement_specification')

describe('useItemTrace', () => {
  it('loads the chain of an item in the direction that the query names', async () => {
    const { result } = renderHookWithProviders(() =>
      useItemTrace(requirement.id, { direction: 'forward' }),
    )

    await waitForSuccess(result)
    expect(result.current.data?.items.map(({ key }) => key)).toEqual(['REQ-001', 'US-001'])
  })
})

describe('useArtifactTrace', () => {
  it('loads the chains of all the items of an artifact', async () => {
    const { result } = renderHookWithProviders(() => useArtifactTrace(specification.id))

    await waitForSuccess(result)
    expect(result.current.data?.items.map(({ key }) => key)).toContain('PER-001#2')
  })
})

describe('enabling', () => {
  itWaitsUntilEnabled([
    {
      name: 'useItemTrace',
      useHook: () => useItemTrace(requirement.id, {}, { isEnabled: false }),
    },
    {
      name: 'useArtifactTrace',
      useHook: () => useArtifactTrace(specification.id, {}, { isEnabled: false }),
    },
  ])
})
