import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'

import { useKindTitleOf } from '../useKindTitleOf'

describe('useKindTitleOf', () => {
  it('gives the title of a kind the definition names', async () => {
    const { result } = renderHookWithProviders(() => useKindTitleOf())

    await waitFor(() => {
      expect(result.current('persona')).toBe('Interviewee')
    })
    expect(result.current('raw_requirement')).toBe('Stated need')
  })

  it('gives the kind itself while the kinds load and for one it does not have', async () => {
    const { result } = renderHookWithProviders(() => useKindTitleOf())

    expect(result.current('persona')).toBe('persona')
    await waitFor(() => {
      expect(result.current('persona')).toBe('Interviewee')
    })
    expect(result.current('no_such_kind')).toBe('no_such_kind')
  })
})
