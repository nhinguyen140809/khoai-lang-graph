import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useItemLinks } from '../useItemLinks'

const projectId = projectIds.mentor

describe('useItemLinks', () => {
  it('groups the links of an item that is out of date, with its titles', async () => {
    const outOfDate = itemFixtureByKey(projectId, 'REQ-003')
    const { result } = renderHookWithProviders(() => useItemLinks(outOfDate.id))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    if (result.current.state !== 'success') return

    const basedOn = result.current.outgoing.find(({ linkType }) => linkType === 'derived_from')
    expect(basedOn?.rows[0]?.other.key).toBe('AR-007')
    expect(basedOn?.rows[0]?.isOutOfDate).toBe(true)
    expect(result.current.count).toBeGreaterThan(0)
  })

  it('marks the quoted words of an item, by field', async () => {
    const item = itemFixtureByKey(projectId, 'REQ-001')
    const { result } = renderHookWithProviders(() => useItemLinks(item.id))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    if (result.current.state !== 'success') return

    const marks = result.current.fieldMarks.get('statement') ?? []
    expect(marks.length).toBeGreaterThan(0)
    expect(marks[0]?.color).toBe('primary')
    expect(result.current.rowsByLinkId.size).toBe(result.current.count)
  })

  it('marks the words that another item quotes in the yellow of the charts', async () => {
    const item = itemFixtureByKey(projectId, 'AR-010')
    const { result } = renderHookWithProviders(() => useItemLinks(item.id))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    if (result.current.state !== 'success') return

    const marks = result.current.fieldMarks.get('statement') ?? []
    expect(marks[0]?.color).toBe('chart')
  })

  it('reads nothing for an item with no link', () => {
    const personaCatalog = artifactFixtureByKind(projectId, 'persona_catalog')
    const { result } = renderHookWithProviders(() => useItemLinks('missing-item'))

    expect(result.current).toEqual({ state: 'pending' })
    expect(personaCatalog.kind).toBe('persona_catalog')
  })
})
