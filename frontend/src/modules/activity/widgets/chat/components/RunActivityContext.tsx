'use client'

import type { ReactNode } from 'react'
import { createContext } from 'react'

import type { Run } from '@/modules/run/entities'
import type { Thread } from '@/modules/thread/entities'

/**
 * What every entry of one run of the chat holds: the run its entries belong to, the thread they
 * were sent to, the project they run in and the entry the address names. One provider wraps the entries of a run, so a view
 * of an entry reads these through the hook instead of a prop that each layer above passes on.
 */
export interface RunActivityContextValue {
  run: Run
  /** The thread the run belongs to, so an entry can act on it, such as sending a message again. */
  thread: Thread | null
  projectId: string
  /** The id of the entry that the address names, which takes the focus and a wash of color; none when it names none. */
  targetEntryId?: string | null | undefined
}

export const RunActivityContext = createContext<RunActivityContextValue | undefined>(undefined)

/** Provides what every entry of one run of the chat holds to the entries under it. */
export function RunActivityProvider({
  value,
  children,
}: {
  value: RunActivityContextValue
  children: ReactNode
}) {
  return <RunActivityContext.Provider value={value}>{children}</RunActivityContext.Provider>
}
