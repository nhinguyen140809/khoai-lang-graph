import { beforeEach, describe, expect, it, vi } from 'vitest'

import { debounce } from '../debounce.utils'

beforeEach(() => {
  vi.useFakeTimers()
})

describe('debounce', () => {
  it('runs once after the wait, with the arguments of the last call', () => {
    const run = vi.fn()
    const debounced = debounce(run, 300)

    debounced('a')
    debounced('ab')
    debounced('abc')
    vi.advanceTimersByTime(300)

    expect(run).toHaveBeenCalledTimes(1)
    expect(run).toHaveBeenCalledWith('abc')
  })

  it('does not run before the wait has passed', () => {
    const run = vi.fn()
    const debounced = debounce(run, 300)

    debounced()
    vi.advanceTimersByTime(299)

    expect(run).not.toHaveBeenCalled()
  })

  it('starts the wait again with each call', () => {
    const run = vi.fn()
    const debounced = debounce(run, 300)

    debounced()
    vi.advanceTimersByTime(200)
    debounced()
    vi.advanceTimersByTime(200)

    expect(run).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('runs again for a call after the wait', () => {
    const run = vi.fn()
    const debounced = debounce(run, 300)

    debounced('a')
    vi.advanceTimersByTime(300)
    debounced('b')
    vi.advanceTimersByTime(300)

    expect(run.mock.calls).toEqual([['a'], ['b']])
  })

  it('drops the call that waits on cancel', () => {
    const run = vi.fn()
    const debounced = debounce(run, 300)

    debounced()
    debounced.cancel()
    vi.advanceTimersByTime(300)

    expect(run).not.toHaveBeenCalled()
  })

  it('runs the call that waits at once on flush, and only once', () => {
    const run = vi.fn()
    const debounced = debounce(run, 300)

    debounced('a')
    debounced.flush()
    vi.advanceTimersByTime(300)

    expect(run).toHaveBeenCalledTimes(1)
    expect(run).toHaveBeenCalledWith('a')
  })

  it('does nothing on flush when no call waits', () => {
    const run = vi.fn()

    debounce(run, 300).flush()

    expect(run).not.toHaveBeenCalled()
  })

  it('does nothing on flush after cancel', () => {
    const run = vi.fn()
    const debounced = debounce(run, 300)

    debounced('a')
    debounced.cancel()
    debounced.flush()

    expect(run).not.toHaveBeenCalled()
  })

  it('runs the call that waits on flush even when it has no arguments', () => {
    const run = vi.fn()
    const debounced = debounce(run, 300)

    debounced()
    debounced.flush()

    expect(run).toHaveBeenCalledTimes(1)
  })

  it('waits again after a flush', () => {
    const run = vi.fn()
    const debounced = debounce(run, 300)

    debounced('a')
    debounced.flush()
    debounced('b')
    vi.advanceTimersByTime(300)

    expect(run.mock.calls).toEqual([['a'], ['b']])
  })
})
