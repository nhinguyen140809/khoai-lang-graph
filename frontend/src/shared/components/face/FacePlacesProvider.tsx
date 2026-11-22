'use client'

import type { ReactNode } from 'react'

import { FacePlacesContext } from './FacePlacesContext'

/** Gives every face below it the seeds of the agents of the workflow in order, so that each agent has the face at its own place and no two agents share one. */
export function FacePlacesProvider({
  seeds,
  children,
}: {
  seeds: readonly string[]
  children: ReactNode
}) {
  return <FacePlacesContext value={seeds}>{children}</FacePlacesContext>
}
