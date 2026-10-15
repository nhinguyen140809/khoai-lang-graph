import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useModifierKeyName } from '../useModifierKeyName'
import { platformCases } from './useModifierKeyName.data'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useModifierKeyName', () => {
  it.each(platformCases)('names $name on $platform', ({ userAgent, name }) => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent)

    expect(renderHook(() => useModifierKeyName()).result.current).toBe(name)
  })
})
