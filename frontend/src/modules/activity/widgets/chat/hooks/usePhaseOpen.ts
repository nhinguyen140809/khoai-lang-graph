'use client'

import { useState } from 'react'

import type { WorkEntry } from '@/modules/run/entities'
import { isPhaseOpenByDefault } from '@/modules/run/entities'

/** What the reader chose for a phase: open or closed, for the status it had then. */
interface PhaseChoice {
  isOpen: boolean
  status: WorkEntry['status']
}

/**
 * Which phases of the chat show their items. A phase is open until it is done, and closes then; the
 * reader may open or close it in between, and the next change of its status takes over again.
 */
export function usePhaseOpen() {
  const [chosen, setChosen] = useState<ReadonlyMap<string, PhaseChoice>>(new Map())

  const isOpen = (work: WorkEntry): boolean => {
    const choice = chosen.get(work.id)
    return choice?.status === work.status ? choice.isOpen : isPhaseOpenByDefault(work)
  }

  const toggle = (work: WorkEntry) => {
    setChosen((before) => {
      const choice = before.get(work.id)
      const isOpenBefore =
        choice?.status === work.status ? choice.isOpen : isPhaseOpenByDefault(work)
      return new Map(before).set(work.id, { isOpen: !isOpenBefore, status: work.status })
    })
  }

  return { isOpen, toggle }
}
