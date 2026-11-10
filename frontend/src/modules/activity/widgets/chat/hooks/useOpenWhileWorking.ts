'use client'

import { useState } from 'react'

/**
 * The open state of a line of work that has details: open while the work is in progress, so that
 * what its steps note is in view as it happens, and closed again once the work is done. The reader
 * may open or close it in between; the next change of the work takes over again.
 */
export function useOpenWhileWorking(isWorking: boolean) {
  const [open, setOpen] = useState(isWorking)
  const [wasWorking, setWasWorking] = useState(isWorking)
  // The work changed: follow it during this render, instead of in an effect after it.
  if (isWorking !== wasWorking) {
    setWasWorking(isWorking)
    setOpen(isWorking)
  }
  return [open, setOpen] as const
}
