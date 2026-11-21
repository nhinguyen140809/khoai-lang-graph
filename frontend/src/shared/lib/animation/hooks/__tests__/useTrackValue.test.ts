import { renderHook } from '@testing-library/react'
import { motionValue } from 'motion/react'
import { describe, expect, it } from 'vitest'

import { useLoopValues } from '../useLoopValues'
import { useTrackValue } from '../useTrackValue'

describe('useTrackValue', () => {
  it('gives the value between its stops at the point of the round', () => {
    const position = motionValue(0.5)
    const { result } = renderHook(() => useTrackValue(position, { values: [0, 10] }, 0))

    expect(result.current.get()).toBe(5)
  })

  it('goes from its rest as far as the gain says', () => {
    const position = motionValue(1)
    const gain = motionValue(0.5)
    const { result } = renderHook(() => useTrackValue(position, { values: [1, 3] }, 1, gain))

    expect(result.current.get()).toBe(2)
  })

  it('stays at rest with no stops', () => {
    const { result } = renderHook(() => useTrackValue(motionValue(0.7), undefined, 1))

    expect(result.current.get()).toBe(1)
  })

  it('follows the times it is given, not an even spacing', () => {
    const { result } = renderHook(() =>
      useTrackValue(motionValue(0.5), { values: [0, 10, 10], times: [0, 0.5, 1] }, 0),
    )

    expect(result.current.get()).toBe(10)
  })
})

describe('useLoopValues', () => {
  it('gives every track, those the motion does not move at their rest', () => {
    const { result } = renderHook(() =>
      useLoopValues(motionValue(1), { y: { values: [0, -2] }, opacity: { values: [0, 1] } }),
    )

    expect(result.current.y.get()).toBe(-2)
    expect(result.current.opacity.get()).toBe(1)
    expect(result.current.scale.get()).toBe(1)
    expect(result.current.rotate.get()).toBe(0)
  })
})
