import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useLinkTargets } from '../useLinkTargets'

const projectId = projectIds.mentor

describe('useLinkTargets', () => {
  it('searches the items of the given kinds by the words of their title or their key, without the item itself', async () => {
    const source = itemFixtureByKey(projectId, 'AR-003')
    const { result } = renderHookWithProviders(() =>
      useLinkTargets(projectId, {
        kinds: ['spec_requirement', 'raw_requirement'],
        text: 'booking',
        excludeId: source.id,
      }),
    )

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
    expect(result.current.isError).toBe(false)
    expect(result.current.items.length).toBeGreaterThan(0)
    for (const item of result.current.items) {
      expect(item.id).not.toBe(source.id)
      expect(['spec_requirement', 'raw_requirement', 'latent_need']).toContain(item.kind)
    }
  })

  it('narrows nothing when the kind of the link names none', async () => {
    const source = itemFixtureByKey(projectId, 'VAL-001')
    const { result } = renderHookWithProviders(() =>
      useLinkTargets(projectId, { kinds: [], text: 'booking', excludeId: source.id }),
    )

    await waitFor(() => {
      expect(result.current.items.length).toBeGreaterThan(0)
    })
    expect(new Set(result.current.items.map(({ kind }) => kind)).size).toBeGreaterThan(1)
  })
})
