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

  it('leaves a key without the modifier to a field the user types in', () => {
    const plain = vi.fn()
    const withMod = vi.fn()
    renderHook(() => {
      useHotkey('?', plain)
      useHotkey('k', withMod, { mod: true })
    })
    const input = document.createElement('input')
    const textarea = document.createElement('textarea')
    document.body.append(input, textarea)

    const typed = fireEvent.keyDown(input, { key: '?' })
    fireEvent.keyDown(textarea, { key: '?' })
    fireEvent.keyDown(input, { key: 'k', ctrlKey: true })
    fireEvent.keyDown(document.body, { key: '?' })

    expect(typed).toBe(true)
    expect(plain).toHaveBeenCalledTimes(1)
    expect(withMod).toHaveBeenCalledTimes(1)
    input.remove()
    textarea.remove()
  })

  it('matches by the character on a Latin layout, else by the place of the key', () => {
    const handler = vi.fn()
    renderHook(() => {
      useHotkey('k', handler, { mod: true })
    })

    // Cyrillic layout: the K key types a letter that is not Latin.
    fireEvent.keyDown(document, { key: '\u043b', code: 'KeyK', ctrlKey: true })
    // Dvorak: the key labeled K sits where V is on a US keyboard.
    fireEvent.keyDown(document, { key: 'k', code: 'KeyV', ctrlKey: true })
    // Dvorak: the key at the place of K types T, which is not the hotkey.
    fireEvent.keyDown(document, { key: 't', code: 'KeyK', ctrlKey: true })

    expect(handler).toHaveBeenCalledTimes(2)
  })
})
