import { describe, expect, it, vi } from 'vitest'

import { coalescedTask } from '../coalesced-task.utils'

/** A task whose runs end one by one, when the test ends them. */
function controlledTask() {
  const ends: (() => void)[] = []
  const task = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        ends.push(resolve)
      }),
  )
  const endRun = async () => {
    ends.shift()?.()
    // Lets the task start its next run, if it has one.
    await Promise.resolve()
    await Promise.resolve()
  }
  return { task, endRun }
}

describe('coalescedTask', () => {
  it('runs once for each call that comes after the run before it ended', async () => {
    const { task, endRun } = controlledTask()
    const call = coalescedTask(task)

    call()
    await endRun()
    call()
    await endRun()

    expect(task).toHaveBeenCalledTimes(2)
  })

  it('runs once more after a run during which it was called, however many times', async () => {
    const { task, endRun } = controlledTask()
    const call = coalescedTask(task)

    call()
    call()
    call()
    expect(task).toHaveBeenCalledTimes(1)

    await endRun()
    expect(task).toHaveBeenCalledTimes(2)
    await endRun()
    expect(task).toHaveBeenCalledTimes(2)
  })

  it('goes on after a run that fails', async () => {
    const task = vi.fn().mockRejectedValueOnce(new Error('Failed')).mockResolvedValue(undefined)
    const call = coalescedTask(task)

    call()
    call()

    await vi.waitFor(() => {
      expect(task).toHaveBeenCalledTimes(2)
    })
  })
})
