import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useModifierKeyName } from '../useModifierKeyName'
import { platformCases } from './useModifierKeyName.data'

describe('useModifierKeyName', () => {
  it.each(platformCases)('names $name on $platform', ({ userAgent, name }) => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent)

    expect(renderHook(() => useModifierKeyName()).result.current).toBe(name)
  })
})
