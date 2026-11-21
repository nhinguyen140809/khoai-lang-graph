import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'

import { useLinkTitleOf } from '../useLinkTitleOf'

describe('useLinkTitleOf', () => {
  it('reads the title of each link type of the current definition, by its key', async () => {
    const { result } = renderHookWithProviders(() => useLinkTitleOf())

    await waitFor(() => {
      expect(result.current('derived_from')).toBe('Based on')
    })
    expect(result.current('evidenced_by')).toBe('Evidenced by')
  })

  it('gives the key itself for a link type the definition does not have', async () => {
    const { result } = renderHookWithProviders(() => useLinkTitleOf())

    await waitFor(() => {
      expect(result.current('derived_from')).toBe('Based on')
    })
    expect(result.current('no_such_link_type')).toBe('no_such_link_type')
  })
})
