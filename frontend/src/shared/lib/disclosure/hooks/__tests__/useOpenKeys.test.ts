import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useOpenKeys } from '../useOpenKeys'

describe('useOpenKeys', () => {
  it('opens the keys given at first', () => {
    const { result } = renderHook(() => useOpenKeys(['a', 'b']))

    expect(result.current.isOpen('a')).toBe(true)
    expect(result.current.isOpen('b')).toBe(true)
    expect(result.current.isOpen('c')).toBe(false)
  })

  it('toggles a key open and closed', () => {
    const { result } = renderHook(() => useOpenKeys(['a']))

    act(() => {
      result.current.toggle('a')
    })
    expect(result.current.isOpen('a')).toBe(false)

    act(() => {
      result.current.toggle('a')
    })
    expect(result.current.isOpen('a')).toBe(true)
  })

  it('opens a key that joins them, and keeps a key the user closed closed', () => {
    const { result, rerender } = renderHook(({ keys }: { keys: string[] }) => useOpenKeys(keys), {
      initialProps: { keys: ['a'] },
    })

    act(() => {
      result.current.toggle('a')
    })
    rerender({ keys: ['a', 'b'] })

    // b joins: it opens. a stayed among the keys, so the user keeps it closed.
    expect(result.current.isOpen('b')).toBe(true)
    expect(result.current.isOpen('a')).toBe(false)
  })

  it('opens a key again when it leaves and joins again', () => {
    const { result, rerender } = renderHook(({ keys }: { keys: string[] }) => useOpenKeys(keys), {
      initialProps: { keys: ['a', 'b'] },
    })

    act(() => {
      result.current.toggle('b')
    })
    expect(result.current.isOpen('b')).toBe(false)

    rerender({ keys: ['a'] })
    rerender({ keys: ['a', 'b'] })

    expect(result.current.isOpen('b')).toBe(true)
  })

  it('keeps a key that leaves as it is', () => {
    const { result, rerender } = renderHook(({ keys }: { keys: string[] }) => useOpenKeys(keys), {
      initialProps: { keys: ['a', 'b'] },
    })

    rerender({ keys: ['a'] })

    expect(result.current.isOpen('b')).toBe(true)
  })
})
