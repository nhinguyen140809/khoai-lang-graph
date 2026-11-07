'use client'

import { useEffect, useEffectEvent } from 'react'

import { coalescedTask } from '../coalesced-task.utils'

/**
 * Listens while `key` is not null, gives each signal to `onSignal`, and runs `task` for each signal
 * that `isWanted` accepts: the calls of a burst share one run, and a call during a run is followed
 * by one more. `task` gets `isClosed`, true once the listening stopped, so that it reports nothing
 * after. It listens again when `key` changes, and reads its functions when it needs them.
 */
export function useCoalescedListener<Signal>(
  key: string | null,
  {
    listen,
    isWanted,
    task,
    onSignal,
  }: {
    listen: (listener: (signal: Signal) => void) => () => void
    isWanted: (signal: Signal) => boolean
    task: (run: { isClosed: () => boolean }) => Promise<void> | void
    onSignal?: ((signal: Signal) => void) | undefined
  },
): void {
  const listenTo = useEffectEvent(listen)
  const wanted = useEffectEvent(isWanted)
  const runTask = useEffectEvent(task)
  const sawSignal = useEffectEvent((signal: Signal) => onSignal?.(signal))

  useEffect(() => {
    if (key === null) return
    // Set once the cleanup stops the listening, so that a task in progress reports nothing.
    let isClosed = false
    const run = coalescedTask(async () => {
      await runTask({ isClosed: () => isClosed })
    })
    const stop = listenTo((signal) => {
      sawSignal(signal)
      if (wanted(signal)) run()
    })
    return () => {
      isClosed = true
      stop()
    }
  }, [key])
}
