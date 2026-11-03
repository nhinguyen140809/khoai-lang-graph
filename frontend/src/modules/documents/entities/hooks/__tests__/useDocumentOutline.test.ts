import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useDocumentOutline } from '../useDocumentOutline'

const specification = artifactFixtureByKind(projectIds.mentor, 'requirement_specification')

describe('useDocumentOutline', () => {
  it('marks REQ-003 out of date in the outline of the specification', async () => {
    const { result } = renderHookWithProviders(() => useDocumentOutline(specification.id))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    if (result.current.state !== 'success') return

    const outOfDate = itemFixtureByKey(projectIds.mentor, 'REQ-003')
    const marked = result.current.statuses.find(({ item }) => item.id === outOfDate.id)
    expect(marked?.status).toBe('outOfDate')
  })
})
