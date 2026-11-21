'use client'

import { useContext } from 'react'

import { PhaseControlContext } from '../components/entries/PhaseControlContext'

/** The control of the phase of the closest provider: whether its items show, and the switch. */
export function usePhaseControl() {
  return useContext(PhaseControlContext)
}
