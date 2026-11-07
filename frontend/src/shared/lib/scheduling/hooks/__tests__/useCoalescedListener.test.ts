import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useCoalescedListener } from '../useCoalescedListener'

interface Signal {
  name: string
}

// A channel a test drives by hand: it holds its listeners, and gives them the signals it emits.
function manualChannel() {
  const listeners = new Set<(signal: Signal) => void>()
  return {
    listen: (listener: (signal: Signal) => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    emit: (signal: Signal) => {
      for (const listener of [...listeners]) listener(signal)
    },
  }
}

// A task whose run the test ends by hand, so that a signal during it is followed by one more.
function heldTask() {
  let finishRun: (() => void) | undefined
  const task = vi.fn(async () => {
    await new Promise<void>((resolve) => {
      finishRun = resolve
    })
  })
  return {
    task,
    finish: () => {
      finishRun?.()
    },
  }
}

function mount(
  key: string | null,
  options: {
    task?: ((run: { isClosed: () => boolean }) => Promise<void> | void) | undefined
    onSignal?: ((signal: Signal) => void) | undefined
    isWanted?: ((signal: Signal) => boolean) | undefined
  } = {},
) {
  const channel = manualChannel()
  const view = renderHook(
    (next: string | null) => {
      useCoalescedListener<Signal>(next, {
        listen: channel.listen,
        isWanted: options.isWanted ?? (() => true),
        task: options.task ?? (() => undefined),
        onSignal: options.onSignal,
      })
    },
    { initialProps: key },
  )
  return { ...view, ...channel }
}

describe('useCoalescedListener', () => {
  it('listens while the key is not null and stops when it is', () => {
    const task = vi.fn()
    const view = mount('run-1', { task })

    act(() => {
      view.emit({ name: 'a' })
    })
    expect(task).toHaveBeenCalledOnce()

    view.rerender(null)
    act(() => {
      view.emit({ name: 'b' })
    })
    expect(task).toHaveBeenCalledOnce()
  })

  it('runs the task once for a burst, and once more for a signal during its run', async () => {
    const held = heldTask()
    const view = mount('run-1', { task: held.task })

    act(() => {
      view.emit({ name: 'a' })
      view.emit({ name: 'b' })
    })
    expect(held.task).toHaveBeenCalledOnce()

    act(() => {
      view.emit({ name: 'c' })
    })
    expect(held.task).toHaveBeenCalledOnce()

    act(() => {
      held.finish()
    })
    await waitFor(() => {
      expect(held.task).toHaveBeenCalledTimes(2)
    })
  })

  it('gives every signal to onSignal, wanted or not', () => {
    const onSignal = vi.fn()
    const view = mount('run-1', { onSignal, isWanted: (signal) => signal.name === 'wanted' })

    act(() => {
      view.emit({ name: 'other' })
      view.emit({ name: 'wanted' })
    })

    expect(onSignal).toHaveBeenCalledTimes(2)
  })

  it('runs the task only for the signals it wants', () => {
    const task = vi.fn()
    const view = mount('run-1', { task, isWanted: (signal) => signal.name === 'wanted' })

    act(() => {
      view.emit({ name: 'other' })
    })
    expect(task).not.toHaveBeenCalled()

    act(() => {
      view.emit({ name: 'wanted' })
    })
    expect(task).toHaveBeenCalledOnce()
  })

  it('tells the task that it is closed once the listening stopped', async () => {
    const isClosedResults: boolean[] = []
    const view = mount('run-1', {
      task: async ({ isClosed }) => {
        await Promise.resolve()
        isClosedResults.push(isClosed())
      },
    })

    act(() => {
      view.emit({ name: 'a' })
    })
    view.unmount()
    await act(() => Promise.resolve())

    expect(isClosedResults).toEqual([true])
  })

  it('listens again when the key changes', () => {
    const task = vi.fn()
    const view = mount('run-1', { task })
    view.rerender('run-2')

    act(() => {
      view.emit({ name: 'a' })
    })
    expect(task).toHaveBeenCalledOnce()
  })
})
