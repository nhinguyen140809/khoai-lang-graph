'use client'

import type { ReactNode } from 'react'
import { createContext } from 'react'

/** How the reader opens and closes a phase of work: whether it shows its items, and the switch. */
export interface PhaseControl {
  isOpen: boolean
  onToggle: () => void
}

/** A phase that nothing controls shows its items and has no switch to turn. */
export const PhaseControlContext = createContext<PhaseControl>({
  isOpen: true,
  onToggle: () => undefined,
})

/** Gives the separator of a phase, under it, the control of the phase: the items it opens and closes are the ones of the block that holds it. */
export function PhaseControlProvider({
  value,
  children,
}: {
  value: PhaseControl
  children: ReactNode
}) {
  return <PhaseControlContext.Provider value={value}>{children}</PhaseControlContext.Provider>
}
