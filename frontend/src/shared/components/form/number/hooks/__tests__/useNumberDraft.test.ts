import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useNumberDraft } from '../useNumberDraft'

const options = { signed: true, integer: false }
const propsOf = (value: number | null) => ({ value })

describe('useNumberDraft', () => {
  it('starts with the text of the number', () => {
    const { result } = renderHook(() => useNumberDraft(1.5, vi.fn(), options))

    expect(result.current.draft).toBe('1.5')
  })

  it('starts empty for no number', () => {
    const { result } = renderHook(() => useNumberDraft(null, vi.fn(), options))

    expect(result.current.draft).toBe('')
  })

  it('keeps what a number may hold of the typed text, and reports the number', () => {
    const onValueChange = vi.fn()
    const { result } = renderHook(() => useNumberDraft(null, onValueChange, options))

    act(() => {
      result.current.type('1a2')
    })

    expect(result.current.draft).toBe('12')
    expect(onValueChange).toHaveBeenLastCalledWith(12)
  })

  it('keeps a text on the way to a number, which reads as no number yet', () => {
    const onValueChange = vi.fn()
    const { result } = renderHook(() => useNumberDraft(null, onValueChange, options))

    act(() => {
      result.current.type('-')
    })

    expect(result.current.draft).toBe('-')
    expect(onValueChange).toHaveBeenLastCalledWith(null)
  })

  it('drops the sign and the decimals that the options do not allow', () => {
    const { result } = renderHook(() =>
      useNumberDraft(null, vi.fn(), { signed: false, integer: true }),
    )

    act(() => {
      result.current.type('-1.5')
    })

    expect(result.current.draft).toBe('1')
  })

  it('shows a number that is set in full, and reports it', () => {
    const onValueChange = vi.fn()
    const { result } = renderHook(() => useNumberDraft(null, onValueChange, options))

    act(() => {
      result.current.set(0.0000001)
    })

    expect(result.current.draft).toBe('0.0000001')
    expect(onValueChange).toHaveBeenLastCalledWith(0.0000001)
  })

  it('writes the draft in full when it settles', () => {
    const { result } = renderHook(() => useNumberDraft(null, vi.fn(), options))
    act(() => {
      result.current.type('1.')
    })

    act(() => {
      result.current.settle()
    })

    expect(result.current.draft).toBe('1')
  })

  it('empties a draft that holds no number when it settles', () => {
    const { result } = renderHook(() => useNumberDraft(null, vi.fn(), options))
    act(() => {
      result.current.type('-')
    })

    act(() => {
      result.current.settle()
    })

    expect(result.current.draft).toBe('')
  })

  it('replaces the draft with a number that changes from outside', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useNumberDraft(value, vi.fn(), options),
      { initialProps: propsOf(5) },
    )

    rerender(propsOf(null))

    expect(result.current.draft).toBe('')
  })

  it('keeps a draft that already reads as the number from outside', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number | null }) => useNumberDraft(value, vi.fn(), options),
      { initialProps: propsOf(null) },
    )
    act(() => {
      result.current.type('1.')
    })

    rerender(propsOf(1))

    expect(result.current.draft).toBe('1.')
  })
})
