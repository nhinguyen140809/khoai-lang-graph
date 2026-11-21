import { act } from '@testing-library/react'
import { beforeEach, vi } from 'vitest'

/** Moves the fake clock forward, with the renders that its timers cause. */
export function advanceTimers(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

/** The same for timers whose callbacks wait for promises. */
export async function advanceTimersAsync(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

/**
 * Starts each test of the block with fake timers, as `vi.useFakeTimers` does with its options. The
 * setup of the tests puts the real timers back after each test, so there is nothing to undo.
 */
export function withFakeTimers(options?: Parameters<typeof vi.useFakeTimers>[0]) {
  beforeEach(() => {
    vi.useFakeTimers(options)
  })
}
