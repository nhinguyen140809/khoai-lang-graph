import { fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Hotkey } from '../../hotkey.types'
import { useHotkey } from '../useHotkey'

const hotkey: Hotkey = { key: 'b', mod: true }

function press(key: string, isModHeld = false) {
  fireEvent.keyDown(window, { key, ctrlKey: isModHeld, metaKey: isModHeld })
}

describe('useHotkey', () => {
  it('runs on its hotkey and keeps the key from the page', () => {
    const run = vi.fn()
    renderHook(() => {
      useHotkey(hotkey, run)
    })

    press('b', true)

    expect(run).toHaveBeenCalledTimes(1)
  })

  it('does not run on its key without the modifier, or on another key', () => {
    const run = vi.fn()
    renderHook(() => {
      useHotkey(hotkey, run)
    })

    press('b')
    press('a', true)

    expect(run).not.toHaveBeenCalled()
  })

  it('stops listening when the part that asked goes away', () => {
    const run = vi.fn()
    const { unmount } = renderHook(() => {
      useHotkey(hotkey, run)
    })

    unmount()
    press('b', true)

    expect(run).not.toHaveBeenCalled()
  })
})
