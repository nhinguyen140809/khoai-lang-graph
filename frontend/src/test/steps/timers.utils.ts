import { act } from '@testing-library/react'
import { vi } from 'vitest'

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
