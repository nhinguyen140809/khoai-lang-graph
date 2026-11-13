import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { motionMs } from '../../animation.constants'
import { useLeavingRows } from '../useLeavingRows'

const key = (row: string) => row

function names(rows: { row: string; isLeaving: boolean }[]) {
  return rows.map(({ row, isLeaving }) => (isLeaving ? `${row}*` : row))
}

describe('useLeavingRows', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('gives the rows as they are, none of them leaving', () => {
    const { result } = renderHook(() => useLeavingRows(['a', 'b'], key))

    expect(names(result.current)).toEqual(['a', 'b'])
  })

  it('keeps a row that has gone in its place, marked as leaving, until the time is up', () => {
    const { result, rerender } = renderHook(({ rows }) => useLeavingRows(rows, key), {
      initialProps: { rows: ['a', 'b', 'c'] },
    })

    rerender({ rows: ['a', 'c'] })
    expect(names(result.current)).toEqual(['a', 'b*', 'c'])

    act(() => {
      vi.advanceTimersByTime(motionMs)
    })
    expect(names(result.current)).toEqual(['a', 'c'])
  })

  it('keeps every row of a group that has gone, in the order it had', () => {
    const { result, rerender } = renderHook(({ rows }) => useLeavingRows(rows, key), {
      initialProps: { rows: ['a', 'a1', 'a2', 'b'] },
    })

    rerender({ rows: ['a', 'b'] })

    expect(names(result.current)).toEqual(['a', 'a1*', 'a2*', 'b'])
  })

  it('keeps a row that has gone from the top at the top', () => {
    const { result, rerender } = renderHook(({ rows }) => useLeavingRows(rows, key), {
      initialProps: { rows: ['a', 'b'] },
    })

    rerender({ rows: ['b'] })

    expect(names(result.current)).toEqual(['a*', 'b'])
  })

  it('shows a row that comes back during its exit as a row', () => {
    const { result, rerender } = renderHook(({ rows }) => useLeavingRows(rows, key), {
      initialProps: { rows: ['a', 'b'] },
    })

    rerender({ rows: ['a'] })
    rerender({ rows: ['a', 'b'] })

    expect(names(result.current)).toEqual(['a', 'b'])
  })
})
