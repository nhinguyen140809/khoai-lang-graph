import { describe, expect, it, vi } from 'vitest'

import { advanceTimersAsync, withFakeTimers } from '@/test/steps'

import { sleep } from '../sleep.utils'

withFakeTimers()

describe('sleep', () => {
  it('stays pending until the time has passed', async () => {
    const done = vi.fn()
    void sleep(500).then(done)

    await advanceTimersAsync(499)
    expect(done).not.toHaveBeenCalled()

    await advanceTimersAsync(1)
    expect(done).toHaveBeenCalledTimes(1)
  })

  it('settles with nothing', async () => {
    const waiting = sleep(10)

    await advanceTimersAsync(10)

    await expect(waiting).resolves.toBeUndefined()
  })
})
