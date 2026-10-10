import { fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useHotkey } from '../useHotkey'

describe('useHotkey', () => {
  it('calls the handler for Ctrl or Cmd with the key, and prevents the browser default', () => {
    const handler = vi.fn()
    renderHook(() => {
      useHotkey('k', handler, { mod: true })
    })

    const notPrevented = fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    fireEvent.keyDown(document, { key: 'K', metaKey: true })

    expect(notPrevented).toBe(false)
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('ignores the key without the modifier, with Alt, or when disabled', () => {
    const handler = vi.fn()
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => {
        useHotkey('b', handler, { mod: true, enabled })
      },
      { initialProps: { enabled: true } },
    )

    fireEvent.keyDown(document, { key: 'b' })
    fireEvent.keyDown(document, { key: 'b', ctrlKey: true, altKey: true })
    rerender({ enabled: false })
    fireEvent.keyDown(document, { key: 'b', ctrlKey: true })

    expect(handler).not.toHaveBeenCalled()
  })
})
