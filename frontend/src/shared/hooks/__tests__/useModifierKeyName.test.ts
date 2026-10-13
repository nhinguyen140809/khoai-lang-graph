import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useModifierKeyName } from '../useModifierKeyName'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useModifierKeyName', () => {
  it('names Cmd on a Mac and Ctrl elsewhere', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    )
    expect(renderHook(() => useModifierKeyName()).result.current).toBe('Cmd')

    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (X11; Linux x86_64)')
    expect(renderHook(() => useModifierKeyName()).result.current).toBe('Ctrl')
  })
})
