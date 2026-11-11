import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { WorkEntry } from '@/modules/run/entities'

import { usePhaseOpen } from '../usePhaseOpen'

/** Only what the hook reads of a phase: its id and its status. */
const phase = (status: WorkEntry['status'], id = 's1') => ({ id, status }) as WorkEntry

describe('usePhaseOpen', () => {
  it('opens a phase until it is done', () => {
    const { result } = renderHook(() => usePhaseOpen())

    expect(result.current.isOpen(phase('running'))).toBe(true)
    expect(result.current.isOpen(phase('waiting'))).toBe(true)
    expect(result.current.isOpen(phase('failed'))).toBe(true)
    expect(result.current.isOpen(phase('done'))).toBe(false)
  })

  it('lets the reader open a done phase and close a running one', () => {
    const { result } = renderHook(() => usePhaseOpen())

    act(() => {
      result.current.toggle(phase('done'))
      result.current.toggle(phase('running', 's2'))
    })

    expect(result.current.isOpen(phase('done'))).toBe(true)
    expect(result.current.isOpen(phase('running', 's2'))).toBe(false)
  })

  it('takes over again when the status of the phase changes', () => {
    const { result } = renderHook(() => usePhaseOpen())
    act(() => {
      result.current.toggle(phase('running'))
    })
    expect(result.current.isOpen(phase('running'))).toBe(false)

    expect(result.current.isOpen(phase('done'))).toBe(false)
    expect(result.current.isOpen(phase('failed'))).toBe(true)
  })

  it('keeps the choice of one phase apart from another', () => {
    const { result } = renderHook(() => usePhaseOpen())

    act(() => {
      result.current.toggle(phase('done', 's1'))
    })

    expect(result.current.isOpen(phase('done', 's1'))).toBe(true)
    expect(result.current.isOpen(phase('done', 's2'))).toBe(false)
  })
})
