import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import {
  useArtifactTrace,
  useItemTrace,
  useLinkQuotesOf,
  useOutOfDateItemIds,
  useReloadTraces,
} from '../useChainQueries'

const projectId = projectIds.mentor
const requirement = itemFixtureByKey(projectId, 'REQ-001')
const specification = artifactFixtureByKind(projectId, 'requirement_specification')
const transcript = artifactFixtureByKind(projectId, 'interview_transcript')
const message = itemFixtureByKey(projectId, 'PER-001#2')

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

describe('useOutOfDateItemIds', () => {
  it('gives REQ-003 of the specification, empty while it loads', async () => {
    const { result } = renderHookWithProviders(() => useOutOfDateItemIds(specification.id))

    expect(result.current.size).toBe(0)
    await waitFor(() => {
      expect([...result.current]).toEqual([itemFixtureByKey(projectId, 'REQ-003').id])
    })
  })
})

describe('useLinkQuotesOf', () => {
  it('gives the quotes of the messages of the transcript of PER-001', async () => {
    const { result } = renderHookWithProviders(() =>
      useLinkQuotesOf(transcript.id, { isEnabled: true }),
    )

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    if (result.current.state === 'success') {
      expect(result.current.quotesByItem.get(message.id)?.length).toBeGreaterThan(0)
    }
  })

  it('reads nothing while it is not enabled', () => {
    const { result } = renderHookWithProviders(() =>
      useLinkQuotesOf(transcript.id, { isEnabled: false }),
    )

    expect(result.current).toEqual({ state: 'pending' })
  })
})

describe('useReloadTraces', () => {
  it('loads again the queries of the trace module', async () => {
    const chains = renderHookWithProviders(() => useItemTrace(requirement.id))
    await waitFor(() => {
      expect(chains.result.current.data).toBeDefined()
    })

    const { result } = renderHookWithProviders(() => useReloadTraces())
    await result.current()

    await waitFor(() => {
      expect(chains.result.current.isStale).toBe(true)
    })
  })
})
