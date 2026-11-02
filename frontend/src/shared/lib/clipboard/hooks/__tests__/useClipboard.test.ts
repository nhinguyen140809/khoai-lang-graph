import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { advanceTimersAsync } from '@/test/steps'

import { useClipboard } from '../useClipboard'

// jsdom has no clipboard: the test writes into the one the browser would give the page.
const writeText = vi.fn(() => Promise.resolve())

beforeEach(() => {
  writeText.mockClear()
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
})

// Copies a value, which takes the microtask on which the clipboard answers.
async function copy(hook: { copy: (value: string) => void }, value: string) {
  await act(async () => {
    hook.copy(value)
    await Promise.resolve()
  })
}

describe('useClipboard', () => {
  it('copies the value to the clipboard', async () => {
    const { result } = renderHook(() => useClipboard())

    await copy(result.current, 'REQ-001')

    expect(writeText).toHaveBeenCalledWith('REQ-001')
    expect(result.current.isCopied).toBe(true)
  })

  it('goes back to copying two seconds after what was copied', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useClipboard())

    await copy(result.current, 'REQ-001')

    await advanceTimersAsync(2000)

    expect(result.current.isCopied).toBe(false)
  })

  it('starts the two seconds again on a copy while what was copied still holds', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useClipboard())

    await copy(result.current, 'REQ-001')
    await advanceTimersAsync(1500)
    await copy(result.current, 'REQ-002')
    await advanceTimersAsync(1500)

    expect(result.current.isCopied).toBe(true)

    await advanceTimersAsync(500)

    expect(result.current.isCopied).toBe(false)
  })

  it('leaves the state as it was when the clipboard refuses', async () => {
    writeText.mockRejectedValueOnce(new Error('no permission'))
    const { result } = renderHook(() => useClipboard())

    await copy(result.current, 'REQ-001')

    expect(result.current.isCopied).toBe(false)
  })

  it('stops saying that it copied when a copy fails while one before it holds', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useClipboard())

    await copy(result.current, 'REQ-001')
    writeText.mockRejectedValueOnce(new Error('no permission'))
    await copy(result.current, 'REQ-002')

    expect(result.current.isCopied).toBe(false)
  })
})
