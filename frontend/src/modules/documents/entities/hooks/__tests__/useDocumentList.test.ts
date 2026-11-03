import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useDocumentList } from '../useDocumentList'

describe('useDocumentList', () => {
  it('is pending until the documents load', () => {
    const { result } = renderHookWithProviders(() => useDocumentList(projectIds.mentor))

    expect(result.current.state).toBe('pending')
  })

  it('lists the documents of the mentor project with the analysis waiting for review', async () => {
    const { result } = renderHookWithProviders(() => useDocumentList(projectIds.mentor))

    await waitFor(() => {
      const list = result.current
      expect(
        list.state === 'success' &&
          list.entries.find(({ kind }) => kind === 'requirements_analysis')?.mark,
      ).toBe('review')
    })
    const list = result.current
    if (list.state !== 'success') throw new Error('The list did not load')
    expect(list.hasUnfinishedRun).toBe(true)
    expect(list.entries.map(({ kind }) => kind)[0]).toBe('elicitation_plan')
  })
})
