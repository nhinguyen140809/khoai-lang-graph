import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sleep } from '../sleep.utils'

beforeEach(() => {
  vi.useFakeTimers()
})

describe('sleep', () => {
  it('stays pending until the time has passed', async () => {
    const done = vi.fn()
    void sleep(500).then(done)

    await vi.advanceTimersByTimeAsync(499)
    expect(done).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(done).toHaveBeenCalledTimes(1)
  })

  it('settles with nothing', async () => {
    const waiting = sleep(10)

    await vi.advanceTimersByTimeAsync(10)

    await expect(waiting).resolves.toBeUndefined()
  })
})
